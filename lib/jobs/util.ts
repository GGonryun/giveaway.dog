import { NextRequest } from 'next/server';

export const isValidCronSecret = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return false;
  }
  return true;
};
