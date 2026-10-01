import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BackButton } from '../back-button';

describe('BackButton', () => {
  it('matches the snapshot', () => {
    const { container } = render(<BackButton />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
