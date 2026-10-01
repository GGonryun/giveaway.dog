import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProfileIncomplete } from '../profile-incomplete';

describe('ProfileIncomplete', () => {
  it('matches the snapshot', () => {
    const { container } = render(<ProfileIncomplete />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
