export default {
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
