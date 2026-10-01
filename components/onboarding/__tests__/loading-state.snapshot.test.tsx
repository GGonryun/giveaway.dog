import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingState } from '../loading-state';

describe('LoadingState', () => {
  it('matches the snapshot', () => {
    const { container } = render(<LoadingState />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
