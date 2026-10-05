import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Error as ErrorState } from '../error';

describe('Error', () => {
  it('matches the snapshot', () => {
    const { container } = render(<ErrorState />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
