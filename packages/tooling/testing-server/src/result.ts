type ResultLike =
  | { ok: true; data: unknown }
  | { ok: false; data: { code: string; message: string } };

type OkData<R extends ResultLike> = Extract<R, { ok: true }>['data'];

type FailureData<R extends ResultLike> = Extract<R, { ok: false }>['data'];

export const expectOk = <R extends ResultLike>(result: R): OkData<R> => {
  if (!result.ok) {
    throw new Error(
      `Expected an ok result, got ${result.data.code}: ${result.data.message}`
    );
  }
  return result.data;
};

export const expectFailure = <R extends ResultLike>(
  result: R,
  code?: FailureData<R>['code']
): FailureData<R> => {
  if (result.ok) {
    throw new Error(
      `Expected a failure result, got ok: ${JSON.stringify(result.data)}`
    );
  }
  if (code && result.data.code !== code) {
    throw new Error(
      `Expected failure code ${code}, got ${result.data.code}: ${result.data.message}`
    );
  }
  return result.data;
};
