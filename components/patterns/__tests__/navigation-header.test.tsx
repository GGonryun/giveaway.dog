import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NavigationHeader } from '../navigation-header';

describe('NavigationHeader', () => {
  it('renders its children inside a navigation landmark in the page banner', () => {
    render(
      <NavigationHeader>
        <span>Logo</span>
        <span>Menu</span>
      </NavigationHeader>
    );
    const banner = screen.getByRole('banner');
    const navigation = within(banner).getByRole('navigation');
    expect(within(navigation).getByText('Logo')).toBeInTheDocument();
    expect(within(navigation).getByText('Menu')).toBeInTheDocument();
  });

  it('sticks to the top of the page', () => {
    render(
      <NavigationHeader>
        <span>Logo</span>
      </NavigationHeader>
    );
    expect(screen.getByRole('banner')).toHaveClass('sticky', 'top-0');
  });

  it('matches the snapshot', () => {
    const { container } = render(
      <NavigationHeader>
        <span>Logo</span>
      </NavigationHeader>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
