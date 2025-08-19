export type RecursiveRequired<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends object
    ? RecursiveRequired<NonNullable<T[K]>>
    : NonNullable<T[K]>;
};
