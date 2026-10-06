export namespace environment {
  export const is = (key: 'development' | 'production') =>
    process.env.NODE_ENV === key;

  export const appUrl = () =>
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  export const authUrl = () =>
    process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL;
}
