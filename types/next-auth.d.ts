import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      provider?: string;
    } & DefaultSession['user'];
  }
  interface User extends DefaultSession['user'] {
    id: string | null;
  }
  interface JWT {
    id: string | null;
    provider?: string;
  }
}