import { afterEach, describe, vi } from 'vitest';

export type LiveCall = { provider: string; call: string };

type LiveIssue = { path: PropertyKey[]; code: string; expected?: unknown };

type LiveSchema<T> = {
  safeParse: (
    value: unknown
  ) =>
    | { success: true; data: T }
    | { success: false; error: { issues: LiveIssue[] } };
};

type FetchInput = Parameters<typeof fetch>[0];

export type LiveResponse = {
  method: string;
  url: string;
  status: number;
  body: unknown;
};

export const missingLiveVariables = (names: string[]) =>
  names.filter((name) => !process.env[name]);

export const liveVariable = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
};

export const describeLive = (
  title: string,
  variables: string[],
  run: () => void
) =>
  describe.skipIf(missingLiveVariables(variables).length > 0)(
    `${title} (needs ${variables.join(', ')})`,
    () => {
      afterEach(() => {
        vi.unstubAllGlobals();
      });
      run();
    }
  );

const toIssueLine = ({ path, code, expected }: LiveIssue) => {
  const where = path.length > 0 ? path.map(String).join('.') : '(root)';
  return typeof expected === 'string'
    ? `  ${where}: ${code}, expected ${expected}`
    : `  ${where}: ${code}`;
};

export const expectLiveResponse = <T>(
  schema: LiveSchema<T>,
  body: unknown,
  { provider, call }: LiveCall
): T => {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Error(
      [
        `${provider} ${call}: the response does not match the schema of the app`,
        ...result.error.issues.map(toIssueLine)
      ].join('\n')
    );
  }
  return result.data;
};

const readBody = async (response: Response): Promise<unknown> => {
  const text = await response.clone().text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const toMethod = (input: FetchInput, init?: RequestInit) =>
  (
    init?.method ?? (input instanceof Request ? input.method : 'GET')
  ).toUpperCase();

const toUrl = (input: FetchInput) =>
  input instanceof Request ? input.url : String(input);

export const recordResponses = () => {
  const original = globalThis.fetch;
  const responses: LiveResponse[] = [];

  const recordingFetch: typeof fetch = async (input, init) => {
    const response = await original(input, init);
    responses.push({
      method: toMethod(input, init),
      url: toUrl(input),
      status: response.status,
      body: await readBody(response)
    });
    return response;
  };
  vi.stubGlobal('fetch', recordingFetch);

  const find = (match: string, { provider, call }: LiveCall): LiveResponse => {
    const [method, prefix] = match.includes(' ')
      ? match.split(' ', 2)
      : ['GET', match];
    const found = [...responses]
      .reverse()
      .find(
        (response) =>
          response.method === method && response.url.startsWith(prefix)
      );
    if (!found) {
      throw new Error(
        `${provider} ${call}: the app sent no ${method} ${prefix}`
      );
    }
    if (found.status < 200 || found.status >= 300) {
      throw new Error(`${provider} ${call}: HTTP ${found.status}`);
    }
    return found;
  };

  return {
    responses,
    body: (match: string, call: LiveCall) => find(match, call).body
  };
};
