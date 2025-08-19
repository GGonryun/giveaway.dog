import { auth } from '@/lib/auth';
import { UnauthorizedError } from '@/lib/errors';
import { RecursiveRequired } from '@/types/index';
import { Session, User } from 'next-auth';
import { NextResponse } from 'next/server';

export const protect = (fn: (session: Required<User>) => Promise<unknown>) => {
  return async () => {
    const session = await auth();
    if (!isValid(session)) {
      throw new UnauthorizedError({
        message: 'You must be logged in to perform this action.'
      });
    }
    return fn(session.user);
  };
};

const isValid = (
  session: Session | null
): session is RecursiveRequired<Session> => {
  if (!session || !session.user || !session.user.id) return false;
  const now = new Date();
  const expiration = new Date(session.expires);
  return now < expiration;
};
