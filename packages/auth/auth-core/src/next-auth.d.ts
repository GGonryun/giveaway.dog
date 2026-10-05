import { DefaultSession } from 'next-auth';
import { UserAccountType } from '@giveaway/db-model';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      provider?: string;
      onboarded?: boolean;
      accountType?: UserAccountType;
      username?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string | null;
    onboarded?: boolean;
    accountType?: UserAccountType;
    username?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string | null;
    provider?: string;
    onboarded?: boolean;
    accountType?: UserAccountType;
    username?: string | null;
  }
}
