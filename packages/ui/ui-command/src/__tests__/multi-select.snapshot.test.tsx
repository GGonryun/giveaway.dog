import { render } from '@testing-library/react';
import { Mail } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { MultiSelect, type MultiSelectOption } from '../multi-select';
import { withStableIds } from '@giveaway/testing-dom/test-utils';

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
});
