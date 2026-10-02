import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BackButton } from '../back-button';

describe('BackButton', () => {
  it('links back to the browse page', () => {
    render(<BackButton />);
    const link = screen.getByRole('link', { name: 'Browse all sweepstakes' });
    expect(link).toHaveAttribute('href', '/browse');
    expect(link).toHaveAttribute('data-slot', 'button');
  });
});
