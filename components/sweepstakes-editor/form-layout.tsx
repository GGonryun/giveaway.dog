import { MobileSuspense } from '@/components/ui/mobile-suspense';
import { MobileFormLayout } from './mobile-form-layout';
import { DesktopFormLayout } from './desktop-form-layout';
import { useIsTablet } from '@/components/hooks/use-tablet';
import { PreviewStateProvider } from './contexts/preview-state-context';

export interface FormLayoutProps {
  title: string;
  onCancel: () => void;
  disabled: boolean;
  left: React.ReactNode;
  right: React.ReactNode;
}
export interface FormHeaderProps {
  title: string;
  disabled: boolean;
  onCancel: () => void;
}

export const FormLayout: React.FC<FormLayoutProps> = (props) => {
  const { isTablet } = useIsTablet();

  return (
    <PreviewStateProvider>
      <MobileSuspense>
        {isTablet ? (
          <MobileFormLayout {...props} />
        ) : (
          <DesktopFormLayout {...props} />
        )}
      </MobileSuspense>
    </PreviewStateProvider>
  );
};
