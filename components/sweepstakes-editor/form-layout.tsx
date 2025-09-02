import { MobileFormLayout } from './mobile-form-layout';
import { DesktopFormLayout } from './desktop-form-layout';
import { useSweepstakes } from './hooks/use-sweepstake-step';

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
  const { mobile } = useSweepstakes();

  return mobile ? (
    <MobileFormLayout {...props} />
  ) : (
    <DesktopFormLayout {...props} />
  );
};
