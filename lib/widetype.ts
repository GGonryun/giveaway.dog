export namespace widetype {
  export const fromEntries = <T>(entries: [string, T][]) => {
    return Object.fromEntries(entries) as Record<string, T>;
  };
  export const entries = <T extends object>(obj: T) => {
    return Object.entries(obj) as [keyof T, T[keyof T]][];
  };
  export const values = <T extends object>(obj: T) => {
    return Object.values(obj) as T[keyof T][];
  };
  export const keys = <T extends object>(obj: T) => {
    return Object.keys(obj) as (keyof T)[];
  };
}

export const isDefined =
  <T extends object, P extends keyof T>(property: P) =>
  (
    value: T | null | undefined
  ): value is T & { [K in P]-?: NonNullable<T[K]> } => {
    return (
      value !== null &&
      value !== undefined &&
      value[property] !== null &&
      value[property] !== undefined
    );
  };
