import { getRun } from 'workflow/api';
export async function GET(request: Request) {
  const url = new URL(request.url);

  const runId = url.searchParams.get('runId');
  if (!runId) {
    return new Response('Bad Request: Missing runId', { status: 400 });
  }

  // Retrieve the existing run
  const run = getRun(runId);
  // Return the readable stream to the client
  const status = await run.status;

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
