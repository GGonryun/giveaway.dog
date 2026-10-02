import React from 'react';
import { DesktopFormLayout } from './desktop-form-layout';
import { MobileFormLayout } from './mobile-form-layout';
import { FormLayoutProps } from './types';
import { useUnifiedFormLayout } from './use-unified-form-layout';
import { Loader2Icon } from 'lucide-react';

export const UnifiedFormLayout: React.FC<FormLayoutProps> = (props) => {
  const { mobile, isLoadingLayout } = useUnifiedFormLayout();
  if (isLoadingLayout) return <LayoutLoadingFallback />;
  return (
    <>
      {mobile ? (
        <MobileFormLayout {...props} />
      ) : (
        <DesktopFormLayout {...props} />
      )}
    </>
  );
};

const LayoutLoadingFallback: React.FC = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);
