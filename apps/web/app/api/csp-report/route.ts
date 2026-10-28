import {
  CSP_REPORT_MAX_BYTES,
  parseCspReport
} from '@giveaway/csp-model/report';

export async function POST(request: Request) {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > CSP_REPORT_MAX_BYTES) {
    return new Response(null, { status: 413 });
  }

  const text = await request.text();
  if (text.length > CSP_REPORT_MAX_BYTES) {
    return new Response(null, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }

  for (const violation of parseCspReport(body)) {
    console.warn('[csp]', JSON.stringify(violation));
  }

  return new Response(null, { status: 204 });
}
