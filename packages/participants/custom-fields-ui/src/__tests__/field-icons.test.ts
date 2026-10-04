import { describe, it, expect } from 'vitest';
import { SweepstakesFormFieldType } from '@giveaway/db-model';
import { UserIcon, BalloonIcon, MailIcon } from 'lucide-react';
import { SocialXIcon } from '@giveaway/integration-icons/x-icon';
import { FIELD_TYPE_ICON } from '../field-icons';

describe('FIELD_TYPE_ICON', () => {
  it('maps every form field type to its icon component', () => {
    expect(FIELD_TYPE_ICON).toEqual({
      [SweepstakesFormFieldType.USERNAME]: UserIcon,
      [SweepstakesFormFieldType.AGE]: BalloonIcon,
      [SweepstakesFormFieldType.EMAIL]: MailIcon,
      [SweepstakesFormFieldType.TWITTER]: SocialXIcon
    });
  });

  it('covers exactly the prisma form field types', () => {
    expect(Object.keys(FIELD_TYPE_ICON).sort()).toEqual(
      Object.values(SweepstakesFormFieldType).sort()
    );
  });
});
