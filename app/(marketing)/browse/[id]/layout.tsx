import { auth } from '@/lib/auth/config';

interface LayoutProps {
  children: React.ReactNode;
  authenticated: React.ReactNode;
  anonymous: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function BrowseLayout({
  authenticated,
  anonymous
}: LayoutProps) {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return <>{isAuthenticated ? authenticated : anonymous}</>;
}
