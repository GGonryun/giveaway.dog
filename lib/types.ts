export type DeepPartial<T> = T extends Date
  ? T // don’t make Date partial
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

export type RequiredFields<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type DeepNullable<T> = {
  [P in keyof T]: T[P] extends Array<infer U>
    ? Array<DeepNullable<U>> | null
    : T[P] extends object
      ? DeepNullable<T[P]> | null
      : T[P] | null;
};
