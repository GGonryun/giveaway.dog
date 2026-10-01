import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
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

  describe('when first rendered', () => {
    it('uses the default placeholder', () => {
      render(<SearchHarness />);

      expect(searchInput()).toHaveAttribute('placeholder', 'Search users...');
    });

    it('uses a custom placeholder', () => {
      render(<SearchHarness placeholder="Search entrants..." />);

      expect(searchInput()).toHaveAttribute(
        'placeholder',
        'Search entrants...'
      );
    });

    it('does not show a clear button while empty', () => {
      render(<SearchHarness />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('when typing', () => {
    it('reports every new value', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SearchHarness onChange={onChange} />);

      await user.type(searchInput(), 'ada');

      expect(onChange.mock.calls).toEqual([['a'], ['ad'], ['ada']]);
    });

    it('shows up to five matching suggestions regardless of case', async () => {
      const user = userEvent.setup();
      render(<SearchHarness suggestions={SUGGESTIONS} />);

      await user.type(searchInput(), 'DO');

      expect(screen.getByText('Suggestions')).toBeInTheDocument();
      expect(
        screen
          .getAllByRole('button')
          .slice(1)
          .map((button) => button.textContent)
      ).toEqual(['Doggo', 'Dog Club', 'dodo', 'Donut', 'Dolphin']);
    });

    it('does not suggest the exact value already typed', async () => {
      const user = userEvent.setup();
      render(<SearchHarness suggestions={['Doggo', 'Doggo Club']} />);

      await user.type(searchInput(), 'doggo');

      expect(
        screen.getByRole('button', { name: 'Doggo Club' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Doggo' })
      ).not.toBeInTheDocument();
    });

    it('shows no suggestions when nothing matches', async () => {
      const user = userEvent.setup();
      render(<SearchHarness suggestions={SUGGESTIONS} />);

      await user.type(searchInput(), 'zebra');

      expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
    });

    it('shows no suggestions when none are provided', async () => {
      const user = userEvent.setup();
      render(<SearchHarness />);

      await user.type(searchInput(), 'do');

      expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
    });
  });

  describe('when a suggestion is chosen', () => {
    it('fills in the suggestion and reports the selection', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onSuggestionSelect = vi.fn();
      render(
        <SearchHarness
          suggestions={SUGGESTIONS}
          onChange={onChange}
          onSuggestionSelect={onSuggestionSelect}
        />
      );

      await user.type(searchInput(), 'dol');
      await user.click(screen.getByRole('button', { name: 'Dolphin' }));

      expect(searchInput()).toHaveValue('Dolphin');
      expect(onChange).toHaveBeenLastCalledWith('Dolphin');
      expect(onSuggestionSelect).toHaveBeenCalledWith('Dolphin');
      expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
    });
  });

  describe('when focus changes', () => {
    it('hides the suggestions shortly after the input loses focus', async () => {
      const user = userEvent.setup();
      render(<SearchHarness suggestions={SUGGESTIONS} />);

      await user.type(searchInput(), 'do');
      await user.tab();

      await waitFor(() =>
        expect(screen.queryByText('Suggestions')).not.toBeInTheDocument()
      );
    });

    it('shows the suggestions again when the input regains focus', async () => {
      const user = userEvent.setup();
      render(<SearchHarness initialValue="do" suggestions={SUGGESTIONS} />);
      expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();

      await user.click(searchInput());

      expect(screen.getByText('Suggestions')).toBeInTheDocument();
    });
  });

  describe('when the search is cleared', () => {
    it('empties the search and hides the clear button', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SearchHarness initialValue="ada" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      expect(onChange).toHaveBeenCalledWith('');
      expect(searchInput()).toHaveValue('');
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
