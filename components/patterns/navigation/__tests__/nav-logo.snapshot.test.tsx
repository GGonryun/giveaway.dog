import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NavLogo } from '../nav-logo';

describe('NavLogo', () => {
  it('matches the snapshot', () => {
    const { container } = render(<NavLogo />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
