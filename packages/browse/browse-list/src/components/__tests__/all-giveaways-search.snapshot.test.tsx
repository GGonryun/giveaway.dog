import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AllGiveawaysSearch } from '../all-giveaways-search';

describe('AllGiveawaysSearch', () => {
  it('matches the snapshot', () => {
    const { container } = render(<AllGiveawaysSearch />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
