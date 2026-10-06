export namespace environment {
  export const is = (key: 'development' | 'production') =>
    process.env.NODE_ENV === key;

  const deploymentUrl = () => {
    const host = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
    return host ? `https://${host}` : undefined;
  };

  export const appUrl = () =>
    process.env.NEXT_PUBLIC_APP_URL ||
    deploymentUrl() ||
    'http://localhost:3000';
}
