import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger
} from '../popover';
import { withStableIds } from './test-utils';

function renderPopover(
  contentProps: React.ComponentProps<typeof PopoverContent> = {}
) {
  return render(
    <Popover>
      <PopoverAnchor>Anchor</PopoverAnchor>
      <PopoverTrigger>Share</PopoverTrigger>
      <PopoverContent {...contentProps}>Copy the link below.</PopoverContent>
    </Popover>
  );
}

async function openPopover() {
  await userEvent.click(screen.getByRole('button', { name: 'Share' }));
  return screen.findByRole('dialog');
}

describe('Popover', () => {
  it('matches the snapshot when open', async () => {
    renderPopover();
    const content = await openPopover();
    expect(withStableIds(content)).toMatchSnapshot();
  });
});
