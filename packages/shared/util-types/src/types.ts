export type DeepPartial<T> = T extends Date
  ? T // don’t make Date partial
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

export type DeepNil<T> = T extends Date
  ? T // don’t make Date nil
  : T extends Array<infer U>
    ? Array<DeepNil<U>> | null | undefined
    : T extends object
      ? { [K in keyof T]?: DeepNil<T[K]> } | null | undefined
      : T | null | undefined;

export type RequiredFields<T, K extends keyof T> = T extends any
  ? Omit<T, K> & Required<Pick<T, K>>
  : never;

export type OptionalFields<T, K extends keyof T> = T extends any
  ? Omit<T, K> & Partial<Pick<T, K>>
  : never;

export type DeepNullable<T> = {
  [P in keyof T]: T[P] extends Array<infer U>
    ? Array<DeepNullable<U>> | null
    : T[P] extends object
      ? DeepNullable<T[P]> | null
      : T[P] | null;
};

export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

export type Nil<T> = T | null | undefined;

// Expand a union into a union of fully-expanded objects
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

// Convert a union into a flat object with all keys optional
type UnionKeys<T> = T extends T ? keyof T : never;

export type FlatUnion<T> = {
  [K in UnionKeys<T>]?: T extends { [P in K]?: infer V } ? V : never;
};
