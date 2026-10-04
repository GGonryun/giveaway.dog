import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { assertNever } from '@giveaway/util-errors';
import { PickerTypeSchema } from '@giveaway/picker-model/schemas/list';
import { cn } from '@/lib/utils';
import { SocialBlueskyIcon } from '@/lib/integrations/components/icons/bluesky-icon';

export const PickerTypeLogo: React.FC<{
  type: PickerTypeSchema;
  size?: number;
  className?: string;
}> = ({ type, size, className }) => {
  switch (type) {
    case 'TWITTER':
      return <SocialXIcon className={cn(`size-${size || 4}`, className)} />;
    case 'BLUESKY':
      return (
        <SocialBlueskyIcon className={cn(`size-${size || 4}`, className)} />
      );
    default:
      throw assertNever(type);
  }
};
