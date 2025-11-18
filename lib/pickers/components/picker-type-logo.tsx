import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { assertNever } from '@/lib/errors';
import { PickerTypeSchema } from '../schemas/list';
import { cn } from '@/lib/utils';

export const PickerTypeLogo: React.FC<{
  type: PickerTypeSchema;
  size?: number;
  className?: string;
}> = ({ type, size, className }) => {
  switch (type) {
    case 'TWITTER':
      return <SocialXIcon className={cn(`size-${size || 4}`, className)} />;
    default:
      throw assertNever(type);
  }
};
