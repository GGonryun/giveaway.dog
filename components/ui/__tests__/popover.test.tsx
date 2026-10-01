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

  it('toggles the content from the trigger', async () => {
    renderPopover();
    const trigger = screen.getByRole('button', { name: 'Share' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    const content = await openPopover();
    expect(content).toHaveTextContent('Copy the link below.');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(trigger);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is centered below the trigger by default', async () => {
    renderPopover();
    const content = await openPopover();
    expect(content).toHaveAttribute('data-align', 'center');
    expect(content).toHaveAttribute('data-side', 'bottom');
    expect(content).toHaveAttribute('data-slot', 'popover-content');
  });

  it('accepts a custom alignment and class name', async () => {
    renderPopover({ align: 'start', className: 'w-96' });
    const content = await openPopover();
    expect(content).toHaveAttribute('data-align', 'start');
    expect(content).toHaveClass('w-96');
    expect(content).not.toHaveClass('w-72');
  });

  it('closes when Escape is pressed', async () => {
    renderPopover();
    await openPopover();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes when clicking outside', async () => {
    renderPopover();
    await openPopover();
    await userEvent.click(screen.getByText('Anchor'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('marks the anchor with its slot', () => {
    renderPopover();
    expect(screen.getByText('Anchor')).toHaveAttribute(
      'data-slot',
      'popover-anchor'
    );
  });
});
