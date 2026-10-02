import 'server-only';

// this is used for server-side only operations where we don't need any providers
// this is because these happen on the edge and providers are not supported there
import NextAuth from 'next-auth';

import { createAuthConfig } from './config-runtime';

export const noProviderAuth = NextAuth({
  ...createAuthConfig(async () => null),
  providers: []
});
