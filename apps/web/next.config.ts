import { NextConfig } from 'next';
import { withWorkflow } from 'workflow/next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.ngrok-free.app'],
  transpilePackages: [
    '@giveaway/allocation-model',
    '@giveaway/app-config',
    '@giveaway/auth-core',
    '@giveaway/auth-model',
    '@giveaway/auth-provider-e2e',
    '@giveaway/auth-provider-inbound',
    '@giveaway/cache',
    '@giveaway/content-moderation',
    '@giveaway/custom-fields-model',
    '@giveaway/db-client',
    '@giveaway/db-model',
    '@giveaway/db-schema',
    '@giveaway/discord-model',
    '@giveaway/email',
    '@giveaway/feature-flags',
    '@giveaway/integration-icons',
    '@giveaway/integration-model',
    '@giveaway/jobs',
    '@giveaway/kick-auth',
    '@giveaway/leaderboard-model',
    '@giveaway/meta-model',
    '@giveaway/picker-model',
    '@giveaway/platform-catalog',
    '@giveaway/ratelimit',
    '@giveaway/referrals-model',
    '@giveaway/request-context-model',
    '@giveaway/rpc-client',
    '@giveaway/rpc-model',
    '@giveaway/scoring-model',
    '@giveaway/scoring-server',
    '@giveaway/steam-auth',
    '@giveaway/task-jobs-core',
    '@giveaway/team-model',
    '@giveaway/team-permissions',
    '@giveaway/team-settings-shell',
    '@giveaway/theme-model',
    '@giveaway/theme-server',
    '@giveaway/turnstile-model',
    '@giveaway/twitch-api',
    '@giveaway/twitch-model',
    '@giveaway/ui-charts',
    '@giveaway/ui-hooks',
    '@giveaway/ui-primitives',
    '@giveaway/ui-utils',
    '@giveaway/user-model',
    '@giveaway/user-quality-model',
    '@giveaway/user-quality-ui',
    '@giveaway/user-source-model',
    '@giveaway/util-browser',
    '@giveaway/util-collections',
    '@giveaway/util-errors',
    '@giveaway/util-geo',
    '@giveaway/util-html',
    '@giveaway/util-media',
    '@giveaway/util-random',
    '@giveaway/util-strings',
    '@giveaway/util-time',
    '@giveaway/util-types',
    '@giveaway/velora-api',
    '@giveaway/velora-auth',
    '@giveaway/x-model',
    '@giveaway/x-picker-model',
    '@giveaway/youtube-model'
  ],
  experimental: {
    useCache: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        search: ''
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        search: ''
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        search: ''
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        search: ''
      },
      {
        protocol: 'https',
        hostname: 'pic.twitter.com',
        search: ''
      }
    ]
  }
};

export default withWorkflow(nextConfig);
