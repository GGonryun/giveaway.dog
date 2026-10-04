import { NextConfig } from 'next';
import { withWorkflow } from 'workflow/next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.ngrok-free.app'],
  transpilePackages: [
    '@giveaway/allocation-model',
    '@giveaway/app-config',
    '@giveaway/auth-model',
    '@giveaway/auth-provider-e2e',
    '@giveaway/auth-provider-inbound',
    '@giveaway/cache',
    '@giveaway/content-moderation',
    '@giveaway/db-client',
    '@giveaway/db-model',
    '@giveaway/db-schema',
    '@giveaway/email',
    '@giveaway/jobs',
    '@giveaway/kick-auth',
    '@giveaway/leaderboard-model',
    '@giveaway/meta-model',
    '@giveaway/picker-model',
    '@giveaway/referrals-model',
    '@giveaway/steam-auth',
    '@giveaway/task-jobs-core',
    '@giveaway/theme-model',
    '@giveaway/turnstile-model',
    '@giveaway/ui-hooks',
    '@giveaway/ui-utils',
    '@giveaway/util-browser',
    '@giveaway/util-collections',
    '@giveaway/util-errors',
    '@giveaway/util-html',
    '@giveaway/util-media',
    '@giveaway/util-strings',
    '@giveaway/util-types',
    '@giveaway/velora-auth',
    '@giveaway/x-model',
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
