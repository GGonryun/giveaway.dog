import { useIsMobile } from '@/components/hooks/use-mobile';
import { MobileSuspense } from '@/components/ui/mobile-suspense';
import { useState } from 'react';
import { MobileFormLayout } from './mobile-form-layout';
import { DesktopFormLayout } from './desktop-form-layout';

interface FormLayoutProps {
  title: string;
  onSubmit: () => void;
  disabled: boolean;
  left: React.ReactNode;
  right: React.ReactNode;
}

export const FormLayout: React.FC<FormLayoutProps> = (props) => {
  const { isMobile } = useIsMobile();

  return (
    <MobileSuspense>
      {isMobile ? (
        <MobileFormLayout {...props} />
      ) : (
        <DesktopFormLayout {...props} />
      )}
    </MobileSuspense>
  );
};
