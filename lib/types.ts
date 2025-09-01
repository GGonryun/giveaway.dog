export type DeepPartial<T> = T extends Date
  ? T // don’t make Date partial
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

export type RequiredFields<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;
