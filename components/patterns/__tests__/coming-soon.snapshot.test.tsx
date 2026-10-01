import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ComingSoon } from '../coming-soon';

describe('ComingSoon', () => {
  it('matches the snapshot', () => {
    const { container } = render(<ComingSoon />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
