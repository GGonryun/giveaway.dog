import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SocialsSettings } from '../socials-page';

const team = {
  links: [{ platform: 'x', url: 'https://x.com/doggo' }]
};

vi.mock('@giveaway/team-context/team-provider', () => ({
  useTeams: () => ({ activeTeam: team })
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() })
}));

vi.mock('@giveaway/team-server/update-team-links', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

describe('SocialsSettings', () => {
  it('keeps a removed link removed when the page renders again with the same team', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SocialsSettings slug="doggo-club" />);
    const row = screen.getByRole('textbox').parentElement?.parentElement;
    if (!row) throw new Error('Link row not found');

    await user.click(within(row).getAllByRole('button').at(-1)!);
    rerender(<SocialsSettings slug="doggo-club" />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText(/No social links added yet/)).toBeInTheDocument();
  });
});
