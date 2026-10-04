import { NextConfig } from 'next';
import { withWorkflow } from 'workflow/next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.ngrok-free.app'],
  transpilePackages: [
    '@giveaway/account-context',
    '@giveaway/allocation-model',
    '@giveaway/app-config',
    '@giveaway/auth-core',
    '@giveaway/auth-model',
    '@giveaway/auth-provider-e2e',
    '@giveaway/auth-provider-inbound',
    '@giveaway/auth-server',
    '@giveaway/bluesky-model',
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
    '@giveaway/integration-ui',
    '@giveaway/jobs',
    '@giveaway/kick-auth',
    '@giveaway/leaderboard-model',
    '@giveaway/marketing-animations',
    '@giveaway/marketing-ui',
    '@giveaway/meta-model',
    '@giveaway/picker-model',
    '@giveaway/platform-catalog',
    '@giveaway/ratelimit',
    '@giveaway/referrals-model',
    '@giveaway/request-context-model',
    '@giveaway/request-context-server',
    '@giveaway/rpc-client',
    '@giveaway/rpc-model',
    '@giveaway/rpc-server',
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
    '@giveaway/ui-brand',
    '@giveaway/ui-carousel',
    '@giveaway/ui-charts',
    '@giveaway/ui-command',
    '@giveaway/ui-date',
    '@giveaway/ui-file-upload',
    '@giveaway/ui-hooks',
    '@giveaway/ui-layouts',
    '@giveaway/ui-primitives',
    '@giveaway/ui-qr',
    '@giveaway/ui-rich-text',
    '@giveaway/ui-utils',
    '@giveaway/user-model',
    '@giveaway/user-quality-model',
    '@giveaway/user-quality-ui',
    '@giveaway/user-source-model',
    '@giveaway/user-source-ui',
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
    '@giveaway/winners-model',
    '@giveaway/x-import',
    '@giveaway/x-model',
    '@giveaway/x-picker-model',
    '@giveaway/x-scraper',
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
