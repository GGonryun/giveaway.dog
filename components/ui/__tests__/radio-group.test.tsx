import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RadioGroup, RadioGroupItem } from '../radio-group';

function renderRadioGroup(onValueChange = vi.fn()) {
  const result = render(
    <RadioGroup
      defaultValue="host"
      onValueChange={onValueChange}
      aria-label="Account type"
    >
      <RadioGroupItem value="host" aria-label="Host" />
      <RadioGroupItem value="participate" aria-label="Participate" />
      <RadioGroupItem value="both" aria-label="Both" disabled />
    </RadioGroup>
  );
  return { ...result, onValueChange };
}

describe('RadioGroup', () => {
  it('renders a labelled group of radio buttons', () => {
    renderRadioGroup();
    expect(
      screen.getByRole('radiogroup', { name: 'Account type' })
    ).toHaveClass('grid', 'gap-2');
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('checks the default value', () => {
    renderRadioGroup();
    expect(screen.getByRole('radio', { name: 'Host' })).toBeChecked();
    expect(
      screen.getByRole('radio', { name: 'Participate' })
    ).not.toBeChecked();
  });

  it('selects an option when it is clicked', async () => {
    const { onValueChange } = renderRadioGroup();
    await userEvent.click(screen.getByRole('radio', { name: 'Participate' }));
    expect(screen.getByRole('radio', { name: 'Participate' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Host' })).not.toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith('participate');
  });

  it('shows the indicator inside the checked option only', async () => {
    renderRadioGroup();
    expect(
      screen.getByRole('radio', { name: 'Host' }).querySelector('svg')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Participate' }).querySelector('svg')
    ).not.toBeInTheDocument();
  });

  it('moves the selection with the arrow keys and skips disabled options', async () => {
    const user = userEvent.setup();
    const { onValueChange } = renderRadioGroup();
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Host' })).toHaveFocus();

    await user.keyboard('{ArrowDown>}{/ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Participate' })).toBeChecked();

    await user.keyboard('{ArrowDown>}{/ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Host' })).toBeChecked();
    expect(onValueChange.mock.calls).toEqual([['participate'], ['host']]);
  });

  it('does not select a disabled option', async () => {
    const { onValueChange } = renderRadioGroup();
    const disabled = screen.getByRole('radio', { name: 'Both' });
    expect(disabled).toBeDisabled();
    await userEvent.click(disabled);
    expect(disabled).not.toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
