import { getRun } from 'workflow/api';
import { WorkflowRunNotFoundError } from 'workflow/internal/errors';

const readStatus = async (run: ReturnType<typeof getRun>) => {
  try {
    return await run.status;
  } catch (error) {
    if (WorkflowRunNotFoundError.is(error)) return null;
    throw error;
  }
};

export async function GET(request: Request) {
  const url = new URL(request.url);

  const runId = url.searchParams.get('runId');
  if (!runId) {
    return new Response('Bad Request: Missing runId', { status: 400 });
  }

  const run = getRun(runId);
  const status = await readStatus(run);
  if (!status) {
    return new Response('Not Found: Unknown runId', { status: 404 });
  }

  if (status === 'running' || status === 'pending') {
    const readable = run.readable.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(JSON.stringify(chunk) + '\n');
        }
      })
    );

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain' },
      status: 200
    });
  } else {
    return new Response(
      JSON.stringify({
        message: 'No stream available',
        status: status,
        reason: `Cannot resume stream. Current run status is '${status}'.`
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
