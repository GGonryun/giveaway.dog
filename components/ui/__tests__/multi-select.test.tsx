import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mail } from 'lucide-react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  isValidOption,
  MultiSelect,
  type MultiSelectOption
} from '../multi-select';
import { withStableIds } from './test-utils';

const options: MultiSelectOption[] = [
  { label: 'Instagram', value: 'instagram', group: 'Social' },
  { label: 'TikTok', value: 'tiktok', group: 'Social' },
  { label: 'Newsletter', value: 'newsletter', group: 'Email', icon: Mail },
  { label: 'Blog', value: 'blog' }
];

type MultiSelectProps = React.ComponentProps<typeof MultiSelect>;

function renderMultiSelect(props: Partial<MultiSelectProps> = {}) {
  const onValueChange = vi.fn();
  const result = render(
    <MultiSelect
      options={options}
      onValueChange={onValueChange}
      aria-label="Channels"
      {...props}
    />
  );
  return { ...result, onValueChange };
}

function getTrigger() {
  return screen.getByRole('button', { name: /Channels/ });
}

function getBadge(label: string) {
  return within(getTrigger()).getByText(label);
}

async function openList() {
  await userEvent.click(getTrigger());
  return screen.findByRole('listbox');
}

function getOptionLabels() {
  return screen.getAllByRole('option').map((option) => option.textContent);
}

describe('isValidOption', () => {
  it.each([
    [{ label: 'Blog', value: 'blog' }, true],
    [{ label: '', value: 'blog' }, false],
    [{ label: 'Blog', value: '' }, false],
    [{ label: 'Blog' }, false],
    [{}, false]
  ])('returns %s for %o', (option, expected) => {
    expect(isValidOption(option)).toBe(expected);
  });
});

describe('MultiSelect', () => {
  it('matches the snapshot without a selection', () => {
    const { container } = renderMultiSelect();
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it('matches the snapshot with selected values', () => {
    const { container } = renderMultiSelect({
      defaultValue: ['instagram', 'newsletter']
    });
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });

  it('shows the placeholder when nothing is selected', () => {
    const { unmount } = renderMultiSelect();
    expect(getTrigger()).toHaveTextContent('Select options');
    unmount();

    renderMultiSelect({ placeholder: 'Pick channels' });
    expect(getTrigger()).toHaveTextContent('Pick channels');
  });

  it('lists the options under their group headings', async () => {
    renderMultiSelect();
    await openList();
    expect(getOptionLabels()).toEqual([
      'Instagram',
      'TikTok',
      'Newsletter',
      'Blog',
      'Close'
    ]);
    expect(screen.getByText('Social')).toHaveAttribute('cmdk-group-heading');
    expect(screen.getByText('Email')).toHaveAttribute('cmdk-group-heading');
  });

  it('selects options and shows them as badges', async () => {
    const { onValueChange } = renderMultiSelect();
    await openList();

    await userEvent.click(screen.getByRole('option', { name: 'Instagram' }));
    await userEvent.click(screen.getByRole('option', { name: 'Newsletter' }));

    expect(onValueChange.mock.calls).toEqual([
      [['instagram']],
      [['instagram', 'newsletter']]
    ]);
    expect(getBadge('Instagram')).toHaveAttribute('data-slot', 'badge');
    expect(getBadge('Newsletter').querySelector('svg')).toBeInTheDocument();
  });

  it('deselects an option that is chosen again', async () => {
    const { onValueChange } = renderMultiSelect({ defaultValue: ['tiktok'] });
    await openList();
    await userEvent.click(screen.getByRole('option', { name: 'TikTok' }));
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it('checks the selected options in the list', async () => {
    renderMultiSelect({ defaultValue: ['tiktok'] });
    await openList();
    expect(
      screen.getByRole('option', { name: 'TikTok' }).firstElementChild
    ).toHaveClass('bg-primary');
    expect(
      screen.getByRole('option', { name: 'Instagram' }).firstElementChild
    ).toHaveClass('opacity-50');
  });

  it('summarises the selections beyond maxCount', () => {
    renderMultiSelect({
      defaultValue: ['instagram', 'tiktok', 'newsletter', 'blog'],
      maxCount: 2
    });
    expect(getBadge('+ 2 more')).toBeInTheDocument();
    expect(within(getTrigger()).queryByText('Newsletter')).toBeNull();
  });

  it('drops the summarised selections from the summary badge', async () => {
    const { onValueChange } = renderMultiSelect({
      defaultValue: ['instagram', 'tiktok', 'newsletter', 'blog'],
      maxCount: 2
    });

    await userEvent.click(getBadge('+ 2 more').querySelector('svg') as Element);

    expect(onValueChange).toHaveBeenCalledWith(['instagram', 'tiktok']);
    expect(within(getTrigger()).queryByText('+ 2 more')).toBeNull();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('removes a single value from its badge without opening the list', async () => {
    const { onValueChange } = renderMultiSelect({
      defaultValue: ['instagram', 'tiktok']
    });

    await userEvent.click(getBadge('TikTok').querySelector('svg') as Element);

    expect(onValueChange).toHaveBeenCalledWith(['instagram']);
    expect(within(getTrigger()).queryByText('TikTok')).toBeNull();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('clears every value from the trigger', async () => {
    const { onValueChange } = renderMultiSelect({
      defaultValue: ['instagram', 'tiktok']
    });

    await userEvent.click(getTrigger().querySelector('.lucide-x') as Element);

    expect(onValueChange).toHaveBeenCalledWith([]);
    expect(getTrigger()).toHaveTextContent('Select options');
  });

  it('clears every value from the list', async () => {
    const { onValueChange } = renderMultiSelect({ defaultValue: ['blog'] });
    await openList();
    await userEvent.click(screen.getByRole('option', { name: 'Clear' }));
    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  it('closes the list from the Close option', async () => {
    renderMultiSelect();
    await openList();
    await userEvent.click(screen.getByRole('option', { name: 'Close' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the list when the trigger is clicked again', async () => {
    renderMultiSelect();
    await openList();
    await userEvent.click(getTrigger());
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('selects and then clears everything with the select all option', async () => {
    const { onValueChange } = renderMultiSelect({ selectAll: true });
    await openList();

    await userEvent.click(screen.getByRole('option', { name: '(Select All)' }));
    expect(onValueChange).toHaveBeenLastCalledWith([
      'instagram',
      'tiktok',
      'newsletter',
      'blog'
    ]);

    await userEvent.click(screen.getByRole('option', { name: '(Select All)' }));
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it('removes the last value with Backspace in an empty search', async () => {
    const { onValueChange } = renderMultiSelect({
      defaultValue: ['instagram', 'tiktok']
    });
    await openList();
    await userEvent.click(screen.getByPlaceholderText('Search...'));
    await userEvent.keyboard('{Backspace}');
    expect(onValueChange).toHaveBeenCalledWith(['instagram']);
  });

  it('filters the options and the footer actions by the search', async () => {
    renderMultiSelect();
    await openList();
    await userEvent.type(screen.getByPlaceholderText('Search...'), 'news');
    expect(getOptionLabels()).toEqual(['Newsletter']);
  });

  it('applies the variant to the badges', () => {
    renderMultiSelect({ defaultValue: ['blog'], variant: 'secondary' });
    expect(getBadge('Blog')).toHaveClass('bg-secondary');
  });

  it('toggles the badge animation with the wand icon', async () => {
    const { container } = renderMultiSelect({
      defaultValue: ['blog'],
      animation: 2
    });
    const wand = container.querySelector('.lucide-wand-sparkles') as Element;
    expect(getBadge('Blog')).not.toHaveClass('animate-bounce');
    expect(getBadge('Blog')).toHaveStyle({ animationDuration: '2s' });

    await userEvent.click(wand);

    expect(getBadge('Blog')).toHaveClass('animate-bounce');
  });

  it('hides the wand icon without an animation', () => {
    const { container } = renderMultiSelect({ defaultValue: ['blog'] });
    expect(container.querySelector('.lucide-wand-sparkles')).toBeNull();
  });

  it('forwards the ref and extra props to the trigger button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <MultiSelect
        ref={ref}
        options={options}
        onValueChange={vi.fn()}
        aria-label="Channels"
        className="w-64"
        disabled
      />
    );
    expect(ref.current).toBe(getTrigger());
    expect(getTrigger()).toBeDisabled();
    expect(getTrigger()).toHaveClass('w-64', 'min-h-9');
  });
});
