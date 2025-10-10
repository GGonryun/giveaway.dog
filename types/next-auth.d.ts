import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {}
  interface User extends DefaultSession['user'] {
    id: string | null;
  }
  interface JWT {
    id: string | null;
  }
}

