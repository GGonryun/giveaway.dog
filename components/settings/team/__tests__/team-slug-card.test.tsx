import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TeamSlugCard } from '../team-slug-card';

describe('TeamSlugCard', () => {
  it('shows the slug in a disabled field', () => {
    render(<TeamSlugCard slug="doggo-club" />);

    const field = screen.getByRole('textbox');
    expect(field).toHaveValue('doggo-club');
    expect(field).toBeDisabled();
  });

  it('explains that the slug cannot be changed', () => {
    render(<TeamSlugCard slug="doggo-club" />);

    expect(
      screen.getByText('Team slugs cannot be changed after creation.')
    ).toBeInTheDocument();
  });

  it('does not offer a usable save button', () => {
    render(<TeamSlugCard slug="doggo-club" />);

    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    expect(save).toHaveClass('hidden');
  });
});
