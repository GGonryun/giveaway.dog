import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ToggleGroup, ToggleGroupItem } from '../toggle-group';

describe('ToggleGroup', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <ToggleGroup type="single" defaultValue="left" aria-label="Alignment">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('selects one item at a time in single mode', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleGroup
        type="single"
        aria-label="Alignment"
        onValueChange={onValueChange}
      >
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
    );
    expect(screen.getByRole('group', { name: 'Alignment' })).toHaveClass(
      'flex',
      'gap-1'
    );

    await userEvent.click(screen.getByRole('radio', { name: 'Left' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Right' }));

    expect(screen.getByRole('radio', { name: 'Left' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Right' })).toBeChecked();
    expect(onValueChange.mock.calls).toEqual([['left'], ['right']]);
  });

  it('toggles several items in multiple mode', async () => {
    const onValueChange = vi.fn();
    render(
      <ToggleGroup type="multiple" onValueChange={onValueChange}>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Bold' }));
    await userEvent.click(screen.getByRole('button', { name: 'Italic' }));

    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(onValueChange).toHaveBeenLastCalledWith(['bold', 'italic']);
  });

  it('passes the group variant and size to every item', () => {
    render(
      <ToggleGroup type="single" variant="outline" size="sm">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
    );
    screen.getAllByRole('radio').forEach((item) => {
      expect(item).toHaveClass('border', 'h-9');
    });
  });

  it('uses the item variant when the group does not set one', () => {
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="left" variant="outline" size="lg">
          Left
        </ToggleGroupItem>
      </ToggleGroup>
    );
    expect(screen.getByRole('radio', { name: 'Left' })).toHaveClass(
      'border',
      'h-11'
    );
  });

  it('prefers the group variant over the item variant', () => {
    render(
      <ToggleGroup type="single" variant="outline">
        <ToggleGroupItem value="left" variant="default">
          Left
        </ToggleGroupItem>
      </ToggleGroup>
    );
    expect(screen.getByRole('radio', { name: 'Left' })).toHaveClass('border');
  });

  it('merges custom class names on the group and items', () => {
    render(
      <ToggleGroup type="single" className="justify-start">
        <ToggleGroupItem value="left" className="w-full">
          Left
        </ToggleGroupItem>
      </ToggleGroup>
    );
    expect(screen.getByRole('group')).toHaveClass('justify-start');
    expect(screen.getByRole('group')).not.toHaveClass('justify-center');
    expect(screen.getByRole('radio', { name: 'Left' })).toHaveClass('w-full');
  });
});
