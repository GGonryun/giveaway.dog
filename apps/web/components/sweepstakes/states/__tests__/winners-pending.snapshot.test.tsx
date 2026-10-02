import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WinnersPending } from '../winners-pending';

describe('WinnersPending', () => {
  it('matches the snapshot', () => {
    const { container } = render(<WinnersPending />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
