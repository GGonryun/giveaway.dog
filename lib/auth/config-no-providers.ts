'server only';

// this is used for server-side only operations where we don't need any providers
// this is because these happen on the edge and providers are not supported there
import NextAuth from 'next-auth';

import { authConfig } from './config';

export const noProviderAuth = NextAuth({
  ...authConfig,
  providers: []
});
