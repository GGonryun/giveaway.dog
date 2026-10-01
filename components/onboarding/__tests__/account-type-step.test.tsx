import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UserAccountType } from '@prisma/client';
import { AccountTypeStep } from '../account-type-step';

const cardFor = (title: string) => {
  const card = screen.getByText(title).closest('[data-slot="card"]');
  if (!card) throw new Error(`Card for ${title} not found`);
  return card;
};

describe('AccountTypeStep', () => {
  describe('when first rendered', () => {
    it('shows both account types with their descriptions', () => {
      render(<AccountTypeStep onNext={vi.fn()} />);

      expect(screen.getByText('Participate in Giveaways')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Browse and enter giveaways from your favorite creators and brands.'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('Host Giveaways')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Create and manage giveaways for your community, brand, or organization.'
        )
      ).toBeInTheDocument();
    });

    it('highlights the participant option', () => {
      render(<AccountTypeStep onNext={vi.fn()} />);

      expect(cardFor('Participate in Giveaways')).toHaveClass(
        'border-primary',
        'bg-primary/5'
      );
      expect(cardFor('Host Giveaways')).not.toHaveClass('bg-primary/5');
    });
  });

  describe('when continuing', () => {
    it('submits the participant account type by default', async () => {
      const user = userEvent.setup();
      const onNext = vi.fn();
      render(<AccountTypeStep onNext={onNext} />);

      await user.click(screen.getByRole('button', { name: 'Continue' }));

      expect(onNext).toHaveBeenCalledWith(UserAccountType.PARTICIPANT);
    });

    it('submits the host account type after choosing it', async () => {
      const user = userEvent.setup();
      const onNext = vi.fn();
      render(<AccountTypeStep onNext={onNext} />);

      await user.click(screen.getByText('Host Giveaways'));
      await user.click(screen.getByRole('button', { name: 'Continue' }));

      expect(onNext).toHaveBeenCalledWith(UserAccountType.HOST);
    });

    it('submits the last choice when the selection changes twice', async () => {
      const user = userEvent.setup();
      const onNext = vi.fn();
      render(<AccountTypeStep onNext={onNext} />);

      await user.click(screen.getByText('Host Giveaways'));
      await user.click(screen.getByText('Participate in Giveaways'));
      await user.click(screen.getByRole('button', { name: 'Continue' }));

      expect(onNext).toHaveBeenCalledWith(UserAccountType.PARTICIPANT);
    });
  });

  describe('when choosing an account type', () => {
    it('moves the highlight to the chosen card', async () => {
      const user = userEvent.setup();
      render(<AccountTypeStep onNext={vi.fn()} />);

      await user.click(screen.getByText('Host Giveaways'));

      expect(cardFor('Host Giveaways')).toHaveClass('bg-primary/5');
      expect(cardFor('Participate in Giveaways')).not.toHaveClass(
        'bg-primary/5'
      );
    });

    it('does not submit until Continue is clicked', async () => {
      const user = userEvent.setup();
      const onNext = vi.fn();
      render(<AccountTypeStep onNext={onNext} />);

      await user.click(screen.getByText('Host Giveaways'));

      expect(onNext).not.toHaveBeenCalled();
    });
  });
});
