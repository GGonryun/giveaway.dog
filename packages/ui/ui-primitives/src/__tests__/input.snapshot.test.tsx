import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from '../input';

describe('Input', () => {
  it('matches the snapshot', () => {
    const { container } = render(<Input placeholder="Email" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
