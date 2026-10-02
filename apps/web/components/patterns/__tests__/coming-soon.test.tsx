import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ComingSoon } from '../coming-soon';

describe('ComingSoon', () => {
  it('shows the giveaway dog illustration', () => {
    render(<ComingSoon />);
    const image = screen.getByRole('img', { name: 'The Giveaway Dog' });
    expect(image).toHaveAttribute('width', '222');
    expect(image).toHaveAttribute('height', '198');
  });

  it('tells the user the page is coming soon', () => {
    render(<ComingSoon />);
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });
});
