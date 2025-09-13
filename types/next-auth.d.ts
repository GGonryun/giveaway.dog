import { UserType } from '@prisma/client';
import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {}
  interface User extends DefaultSession['user'] {
    id: string | null;
    age: number | null;
    emoji: string | null;
    region: string | null;
    type: UserType[] | null;
  }
}
