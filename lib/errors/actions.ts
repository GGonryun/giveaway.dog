export type ActionSuccess<T> = { ok: true } & T;
export type ActionFailure<TCode extends string> = {
  ok: false;
  code: TCode;
  message: string;
};
export type ActionResult<TSuccess = {}, TCode extends string = string> =
  | ActionSuccess<TSuccess>
  | ActionFailure<TCode>;
