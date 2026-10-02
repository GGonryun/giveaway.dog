import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Winners | Giveaway.dog',
    description: 'View and manage winners',
    robots: {
      index: false,
      follow: false
    }
  };
}

export default function Page() {
  return null;
}
