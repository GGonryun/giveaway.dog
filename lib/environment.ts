export namespace environment {
  export const is = (key: 'development' | 'production') =>
    process.env.NODE_ENV === key;
}
