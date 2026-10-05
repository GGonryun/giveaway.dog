import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '../select';

function renderSelect(props: React.ComponentProps<typeof Select> = {}) {
  return render(
    <Select {...props}>
      <SelectTrigger aria-label="Prize">
        <SelectValue placeholder="Choose a prize" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Gadgets</SelectLabel>
          <SelectItem value="phone">Phone</SelectItem>
          <SelectItem value="tablet" disabled>
            Tablet
          </SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectItem value="bike">Bike</SelectItem>
      </SelectContent>
    </Select>
  );
}

async function openSelect() {
  await userEvent.click(screen.getByRole('combobox', { name: 'Prize' }));
  return screen.findByRole('listbox');
}

describe('Select', () => {
  it('shows the placeholder until a value is chosen', () => {
    renderSelect();
    const trigger = screen.getByRole('combobox', { name: 'Prize' });
    expect(trigger).toHaveTextContent('Choose a prize');
    expect(trigger).toHaveAttribute('data-placeholder');
  });

  it('lists the options when opened', async () => {
    renderSelect();
    await openSelect();
    expect(
      screen.getAllByRole('option').map((option) => option.textContent)
    ).toEqual(['Phone', 'Tablet', 'Bike']);
    expect(screen.getByText('Gadgets')).toHaveClass('font-semibold');
  });

  it('selects an option and reports the value', async () => {
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });
    await openSelect();

    await userEvent.click(screen.getByRole('option', { name: 'Bike' }));

    expect(onValueChange).toHaveBeenCalledWith('bike');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Prize' })).toHaveTextContent(
      'Bike'
    );
  });

  it('does not select a disabled option', async () => {
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });
    await openSelect();
    const tablet = screen.getByRole('option', { name: 'Tablet' });
    expect(tablet).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(tablet);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('marks the selected option with a check indicator', async () => {
    renderSelect({ defaultValue: 'phone' });
    await openSelect();
    const phone = screen.getByRole('option', { name: 'Phone' });
    expect(phone).toHaveAttribute('aria-selected', 'true');
    expect(phone.querySelector('svg')).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Bike' }).querySelector('svg')
    ).not.toBeInTheDocument();
  });

  it('positions the content as a popper by default', async () => {
    renderSelect();
    const listbox = await openSelect();
    expect(listbox).toHaveClass('data-[side=bottom]:translate-y-1');
  });

  it('cannot be opened when disabled', async () => {
    renderSelect({ disabled: true });
    const trigger = screen.getByRole('combobox', { name: 'Prize' });
    expect(trigger).toBeDisabled();
    await userEvent.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
