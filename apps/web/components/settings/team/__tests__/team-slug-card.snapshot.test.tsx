import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TeamSlugCard } from '../team-slug-card';

describe('TeamSlugCard', () => {
  it('matches the snapshot', () => {
    const { container } = render(<TeamSlugCard slug="doggo-club" />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
