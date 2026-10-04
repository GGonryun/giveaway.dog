import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Cancelled } from '../cancelled';

describe('Cancelled', () => {
  it('matches the snapshot', () => {
    const { container } = render(<Cancelled />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
