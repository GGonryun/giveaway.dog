import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AvatarGroupEasterEgg } from '../avatar-group-easter-egg';

const hosts = ['ebidi', 'kurozzz', 'h7', 'tj', 'lv', 'toniii', 'szamer'].map(
  (label) => ({
    label,
    fallback: label.slice(0, 2).toUpperCase(),
    image: `/hosts/${label}.jpg`
  })
);

const clickAvatars = async (indexes: number[]) => {
  const avatars = screen.getAllByRole('button');
  for (const index of indexes) {
    await userEvent.click(avatars[index]);
  }
};

const easterEggDialog = () =>
  screen.queryByRole('dialog', { name: 'The True Giveaway Dog Logo' });

describe('AvatarGroupEasterEgg', () => {
  it('renders a button with the avatar image for each host', () => {
    render(<AvatarGroupEasterEgg hosts={hosts} />);
    expect(screen.getAllByRole('button')).toHaveLength(7);
    expect(screen.getByRole('img', { name: 'EB' })).toHaveAttribute(
      'width',
      '48'
    );
  });

  it('shows each host fallback initials', () => {
    render(<AvatarGroupEasterEgg hosts={hosts} />);
    expect(screen.getByText('SZ')).toBeInTheDocument();
  });

  it('reveals the true logo after clicking the first and then the sixth host', async () => {
    render(<AvatarGroupEasterEgg hosts={hosts} />);
    await clickAvatars([0, 5]);
    expect(easterEggDialog()).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Easter egg' })).toBeInTheDocument();
  });

  it('still reveals the logo when the secret sequence follows other clicks', async () => {
    render(<AvatarGroupEasterEgg hosts={hosts} />);
    await clickAvatars([3, 0, 5]);
    expect(easterEggDialog()).toBeInTheDocument();
  });

  it.each([[[5]], [[0, 4]], [[5, 0]], [[0, 0, 5]], [[0, 4, 5]]])(
    'keeps the secret hidden for the sequence %j',
    async (sequence) => {
      render(<AvatarGroupEasterEgg hosts={hosts} />);
      await clickAvatars(sequence);
      expect(easterEggDialog()).not.toBeInTheDocument();
    }
  );

  it('can be closed and requires the full sequence again', async () => {
    render(<AvatarGroupEasterEgg hosts={hosts} />);
    await clickAvatars([0, 5]);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(easterEggDialog()).not.toBeInTheDocument();

    await clickAvatars([5]);
    expect(easterEggDialog()).not.toBeInTheDocument();
  });

  it('matches the snapshot', () => {
    const { container } = render(
      <AvatarGroupEasterEgg hosts={hosts.slice(0, 2)} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
