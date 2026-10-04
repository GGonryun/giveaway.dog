import { SocialXIcon } from '@giveaway/integration-icons/x-icon';
import { SweepstakesFormFieldType } from '@prisma/client';
import { LucideIcon, UserIcon, BalloonIcon, MailIcon } from 'lucide-react';

export const FIELD_TYPE_ICON: Record<SweepstakesFormFieldType, LucideIcon> = {
  [SweepstakesFormFieldType.USERNAME]: UserIcon,
  [SweepstakesFormFieldType.AGE]: BalloonIcon,
  [SweepstakesFormFieldType.EMAIL]: MailIcon,
  [SweepstakesFormFieldType.TWITTER]: SocialXIcon
};
