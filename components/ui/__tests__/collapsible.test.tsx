import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '../collapsible';
import { withStableIds } from './test-utils';

function renderCollapsible(
  props: React.ComponentProps<typeof Collapsible> = {}
) {
  return render(
    <Collapsible {...props}>
      <CollapsibleTrigger>Show rules</CollapsibleTrigger>
      <CollapsibleContent>One entry per person.</CollapsibleContent>
    </Collapsible>
  );
}

describe('Collapsible', () => {
  it('matches the snapshot when open', () => {
    const { container } = renderCollapsible({ defaultOpen: true });
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it('hides the content until the trigger is clicked', async () => {
    renderCollapsible();
    const trigger = screen.getByRole('button', { name: 'Show rules' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('One entry per person.')).not.toBeInTheDocument();

    await userEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('One entry per person.')).toBeVisible();
  });

  it('collapses again on a second click and reports each change', async () => {
    const onOpenChange = vi.fn();
    renderCollapsible({ onOpenChange });
    const trigger = screen.getByRole('button', { name: 'Show rules' });

    await userEvent.click(trigger);
    await userEvent.click(trigger);

    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    expect(screen.queryByText('One entry per person.')).not.toBeInTheDocument();
  });

  it('starts open when defaultOpen is set', () => {
    renderCollapsible({ defaultOpen: true });
    expect(screen.getByText('One entry per person.')).toBeVisible();
  });

  it('does not toggle when disabled', async () => {
    renderCollapsible({ disabled: true });
    const trigger = screen.getByRole('button', { name: 'Show rules' });
    expect(trigger).toBeDisabled();
    await userEvent.click(trigger);
    expect(screen.queryByText('One entry per person.')).not.toBeInTheDocument();
  });
});
