import { MobileSuspense } from '@/components/ui/mobile-suspense';
import { MobileFormLayout } from './mobile-form-layout';
import { DesktopFormLayout } from './desktop-form-layout';
import { useIsTablet } from '@/components/hooks/use-tablet';

interface FormLayoutProps {
  title: string;
  onSubmit: () => void;
  disabled: boolean;
  left: React.ReactNode;
  right: React.ReactNode;
}

export const FormLayout: React.FC<FormLayoutProps> = (props) => {
  const { isTablet } = useIsTablet();

  return (
    <MobileSuspense>
      {isTablet ? (
        <MobileFormLayout {...props} />
      ) : (
        <DesktopFormLayout {...props} />
      )}
    </MobileSuspense>
  );
};
