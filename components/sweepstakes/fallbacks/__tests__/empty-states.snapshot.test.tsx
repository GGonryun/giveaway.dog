import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IncompleteGiveawaySetup } from '../empty-states';

describe('IncompleteGiveawaySetup', () => {
  it('matches the snapshot', () => {
    const { container } = render(<IncompleteGiveawaySetup />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
