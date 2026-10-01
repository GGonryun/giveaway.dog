import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
import { withStableIds } from './test-utils';

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

describe('Select', () => {
  it('matches the snapshot of the closed trigger', () => {
    renderSelect();
    expect(
      withStableIds(screen.getByRole('combobox', { name: 'Prize' }))
    ).toMatchSnapshot();
  });
});
