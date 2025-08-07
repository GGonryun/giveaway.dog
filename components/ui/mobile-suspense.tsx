import React from 'react';
import { useIsMobile } from '../hooks/use-mobile';
import { Loader2Icon } from 'lucide-react';

interface MobileSuspenseProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback: React.FC = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

export const MobileSuspense: React.FC<MobileSuspenseProps> = ({
  children,
  fallback = <DefaultFallback />
}) => {
  const { isLoading } = useIsMobile();

  if (isLoading) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};