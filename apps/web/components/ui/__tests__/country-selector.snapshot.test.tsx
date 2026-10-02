import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CountrySelector } from '../country-selector';
import { withStableIds } from './test-utils';

type CountrySelectorProps = React.ComponentProps<typeof CountrySelector>;

function renderSelector(props: Partial<CountrySelectorProps> = {}) {
  const onValueChange = vi.fn();
  const result = render(
    <CountrySelector onValueChange={onValueChange} {...props} />
  );
  return { ...result, onValueChange };
}

describe('CountrySelector', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches the snapshot when closed', () => {
    const { container } = renderSelector({ className: 'w-80' });
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });
});
