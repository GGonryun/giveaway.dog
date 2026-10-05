import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { withStableIds } from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { DisqualificationDialog } from '../disqualification-dialog';

const renderDialog = (
  props: Partial<ComponentProps<typeof DisqualificationDialog>> = {}
) => {
  const onOpenChange = vi.fn();
  render(
    <DisqualificationDialog
      open
      onOpenChange={onOpenChange}
      participantName="Chad Cheater"
      disqualificationReason="Used multiple accounts"
      {...props}
    />
  );
  return { onOpenChange };
};

describe('DisqualificationDialog', () => {
  it('matches the snapshot', () => {
    renderDialog();
    expect(withStableIds(screen.getByRole('dialog'))).toMatchSnapshot();
  });
});
