import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SearchBar } from '../search-bar';

const SUGGESTIONS = [
  'Doggo',
  'Dog Club',
  'Cat Corner',
  'dodo',
  'Donut',
  'Dolphin',
  'Dove'
];

type HarnessProps = {
  initialValue?: string;
  suggestions?: string[];
  placeholder?: string;
  onChange?: (value: string) => void;
  onSuggestionSelect?: (suggestion: string) => void;
};

const SearchHarness = ({
  initialValue = '',
  onChange,
  ...props
}: HarnessProps) => {
  const [value, setValue] = useState(initialValue);
  return (
    <SearchBar
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
};

const searchInput = () => screen.getByRole('textbox');

describe('SearchBar', () => {
  describe('snapshots', () => {
    it('matches the snapshot when empty', () => {
      const { container } = render(<SearchHarness />);

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches the snapshot with suggestions open', async () => {
      const user = userEvent.setup();
      const { container } = render(<SearchHarness suggestions={SUGGESTIONS} />);

      await user.type(searchInput(), 'cat');

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
