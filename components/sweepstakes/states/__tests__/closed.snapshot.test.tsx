import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Closed } from '../closed';

describe('Closed', () => {
  it('matches the snapshot', () => {
    const { container } = render(<Closed />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
