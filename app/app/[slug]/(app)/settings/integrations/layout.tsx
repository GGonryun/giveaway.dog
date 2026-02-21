import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Team Profile | Giveaway.dog',
    description: 'View your team profile settings and details',
    robots: {
      index: false,
      follow: false
    }
  };
}

export default function IntegrationsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
