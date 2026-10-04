import { SocialXIcon } from '@giveaway/integration-icons/x-icon';
import { assertNever } from '@giveaway/util-errors';
import { PickerTypeSchema } from '@giveaway/picker-model/schemas/list';
import { cn } from '@giveaway/ui-utils/utils';
import { SocialBlueskyIcon } from '@giveaway/integration-icons/bluesky-icon';

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
