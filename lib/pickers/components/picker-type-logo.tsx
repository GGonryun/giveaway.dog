import { SocialXIcon } from '@/components/ui/patterns/x-icon';
import { assertNever } from '@/lib/errors';
import { PickerTypeSchema } from '../schemas/list';
import { cn } from '@/lib/utils';

export const PickerTypeLogo: React.FC<{
  type: PickerTypeSchema;
  size?: number;
}> = ({ type, size }) => {
  switch (type) {
    case 'TWITTER':
      return <SocialXIcon className={cn(`size-${size || 4}`)} />;
    default:
      throw assertNever(type);
  }
};
