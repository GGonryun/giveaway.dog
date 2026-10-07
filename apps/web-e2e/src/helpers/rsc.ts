import { expect, type Page, type Request, type Route } from '@playwright/test';

export type ServerAction = {
  id: string;
  url: string;
  args: unknown[];
};

export type ServerActionResponse = {
  status: number;
  text: string;
};

export type ActionResult =
  | { ok: true; data: unknown }
  | {
      ok: false;
      data: { code: string; message: string; cause?: unknown; data?: unknown };
    };

const ACTION_HEADER = 'next-action';

export const isServerActionRequest = (request: Request) =>
  request.method() === 'POST' && !!request.headers()[ACTION_HEADER];

const toServerAction = (request: Request): ServerAction => ({
  id: request.headers()[ACTION_HEADER],
  url: request.url(),
  args: JSON.parse(request.postData() ?? '[]')
});

export const captureServerAction = async (
  page: Page,
  trigger: () => Promise<unknown>,
  { abort = false }: { abort?: boolean } = {}
): Promise<ServerAction> => {
  if (!abort) {
    const [request] = await Promise.all([
      page.waitForRequest(isServerActionRequest),
      trigger()
    ]);
    return toServerAction(request);
  }

  let captured: ServerAction | undefined;
  const handler = async (route: Route) => {
    if (captured || !isServerActionRequest(route.request())) {
      return route.fallback();
    }
    captured = toServerAction(route.request());
    await route.abort();
  };

  await page.route('**/*', handler);
  try {
    await trigger();
    await expect
      .poll(() => captured, { message: 'The page sent no server action' })
      .toBeDefined();
  } finally {
    await page.unroute('**/*', handler);
  }
  return captured!;
};

export const replayServerAction = (
  page: Page,
  action: ServerAction,
  args: unknown[] = action.args
): Promise<ServerActionResponse> => {
  const target = new URL(action.url);

  return page.evaluate(
    async ({ path, id, body }) => {
      const response = await fetch(path, {
        method: 'POST',
        headers: {
          'Next-Action': id,
          'Content-Type': 'text/plain;charset=UTF-8',
          Accept: 'text/x-component'
        },
        body
      });
      return { status: response.status, text: await response.text() };
    },
    {
      path: `${target.pathname}${target.search}`,
      id: action.id,
      body: JSON.stringify(args)
    }
  );
};

export const rewriteServerActions = async (
  page: Page,
  rewrite: (args: unknown[]) => unknown[]
) => {
  const responses: ServerActionResponse[] = [];
  const handler = async (route: Route) => {
    const request = route.request();
    if (!isServerActionRequest(request)) return route.fallback();

    const response = await route.fetch({
      postData: JSON.stringify(rewrite(JSON.parse(request.postData() ?? '[]')))
    });
    responses.push({ status: response.status(), text: await response.text() });
    await route.fulfill({ response });
  };

  await page.route('**/*', handler);
  return { responses, stop: () => page.unroute('**/*', handler) };
};

const ROW_PATTERN = /^([0-9a-f]+):(.*)$/;

export const readActionResult = ({
  status,
  text
}: ServerActionResponse): ActionResult => {
  const rows = new Map<string, string>();
  for (const line of text.split('\n')) {
    const match = line.match(ROW_PATTERN);
    if (match) rows.set(match[1], match[2]);
  }

  const root = rows.get('0');
  if (!root) {
    throw new Error(
      `The response (HTTP ${status}) is not a server action result: ${text.slice(0, 300)}`
    );
  }

  const { a: result } = JSON.parse(root);
  if (typeof result === 'string' && result.startsWith('$@')) {
    return JSON.parse(rows.get(result.slice(2)) ?? 'null');
  }
  return result;
};
