import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IdentityProvider } from '@giveaway/db-model';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderSchema } from '@giveaway/integration-model/providers';
import {
  ProviderButtons,
  ProviderDots,
  ProviderIcons,
  ProviderPills
} from '../provider-buttons';

const identities: IdentityProvider[] = ['GOOGLE', 'DISCORD', 'YOUTUBE'];

const erroredDiscord: ProviderSchema[] = [
  { type: 'DISCORD', scopes: [], label: 'discord-user', status: 'ERROR' }
];

describe('ProviderButtons', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    onSubmit.mockReset();
  });

  it('renders a login button for each identity in order', () => {
    render(<ProviderButtons identities={identities} onSubmit={onSubmit} />);
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Login with Google',
      'Login with Discord',
      'Login with YouTube'
    ]);
  });

  it('calls onSubmit with the provider that was clicked', async () => {
    render(<ProviderButtons identities={identities} onSubmit={onSubmit} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Login with Discord' })
    );
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('DISCORD');
  });

  it('identifies each button as a provider choice for form submission', () => {
    render(<ProviderButtons identities={['GOOGLE']} onSubmit={onSubmit} />);
    const button = screen.getByRole('button', { name: 'Login with Google' });
    expect(button).toHaveAttribute('name', 'provider');
    expect(button).toHaveAttribute('value', 'GOOGLE');
    expect(button).toHaveAttribute('formnovalidate');
  });

  it('disables providers that are not enabled', async () => {
    render(<ProviderButtons identities={identities} onSubmit={onSubmit} />);
    const youtube = screen.getByRole('button', { name: 'Login with YouTube' });
    expect(youtube).toBeDisabled();
    await userEvent.click(youtube);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('offers to reconnect a provider whose account is in an error state', () => {
    render(
      <ProviderButtons
        identities={identities}
        onSubmit={onSubmit}
        userProviders={erroredDiscord}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Reconnect Discord' })
    ).toHaveClass('bg-destructive');
    expect(
      screen.getByRole('button', { name: 'Login with Google' })
    ).not.toHaveClass('bg-destructive');
  });

  it('marks only the last used provider with a badge', () => {
    render(
      <ProviderButtons
        identities={identities}
        onSubmit={onSubmit}
        lastUsedProvider="DISCORD"
      />
    );
    const discord = screen.getByRole('button', { name: /Login with Discord/ });
    expect(within(discord).getByText('Last used')).toBeInTheDocument();
    expect(screen.getAllByText('Last used')).toHaveLength(1);
  });

  it('renders nothing but the wrapper when there are no identities', () => {
    const { container } = render(
      <ProviderButtons identities={[]} onSubmit={onSubmit} />
    );
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});

describe('ProviderIcons', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    onSubmit.mockReset();
  });

  it('labels each icon button with the provider name', () => {
    render(<ProviderIcons identities={identities} onSubmit={onSubmit} />);
    expect(
      screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))
    ).toEqual([
      'Login with Google',
      'Login with Discord',
      'Login with YouTube'
    ]);
  });

  it('calls onSubmit with the provider that was clicked', async () => {
    render(<ProviderIcons identities={identities} onSubmit={onSubmit} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Login with Google' })
    );
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('GOOGLE');
  });

  it('labels an errored provider as a reconnect action', () => {
    render(
      <ProviderIcons
        identities={identities}
        onSubmit={onSubmit}
        userProviders={erroredDiscord}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Reconnect Discord' })
    ).toHaveClass('bg-destructive');
  });

  it('disables providers that are not enabled', () => {
    render(<ProviderIcons identities={identities} onSubmit={onSubmit} />);
    expect(
      screen.getByRole('button', { name: 'Login with YouTube' })
    ).toBeDisabled();
  });

  it('does not show a last used badge', () => {
    render(
      <ProviderIcons
        identities={identities}
        onSubmit={onSubmit}
        lastUsedProvider="GOOGLE"
      />
    );
    expect(screen.queryByText('Last used')).not.toBeInTheDocument();
  });
});

describe('ProviderDots', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    onSubmit.mockReset();
  });

  it('renders one dot per identity', () => {
    render(<ProviderDots identities={identities} onSubmit={onSubmit} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('calls onSubmit with the provider of the clicked dot', async () => {
    render(<ProviderDots identities={identities} onSubmit={onSubmit} />);
    await userEvent.click(screen.getAllByRole('button')[1]);
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('DISCORD');
  });

  it('reveals the provider name in a tooltip on hover', async () => {
    render(<ProviderDots identities={['TWITCH']} onSubmit={onSubmit} />);
    await userEvent.hover(screen.getByRole('button'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Twitch');
  });

  it('dims a provider whose account is in an error state', () => {
    render(
      <ProviderDots
        identities={identities}
        onSubmit={onSubmit}
        userProviders={erroredDiscord}
      />
    );
    const [google, discord] = screen.getAllByRole('button');
    expect(discord.parentElement).toHaveClass('opacity-50');
    expect(google.parentElement).not.toHaveClass('opacity-50');
  });
});

describe('ProviderPills', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    onSubmit.mockReset();
  });

  it('renders a themed login pill for each identity', () => {
    render(<ProviderPills identities={['GOOGLE']} onSubmit={onSubmit} />);
    expect(
      screen.getByRole('button', { name: 'Login with Google' })
    ).toHaveClass('bg-google-1', 'fill-google-1', 'text-white');
  });

  it('calls onSubmit with the provider that was clicked', async () => {
    render(<ProviderPills identities={identities} onSubmit={onSubmit} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Login with Google' })
    );
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('GOOGLE');
  });

  it('drops the provider theme and offers to reconnect an errored account', () => {
    render(
      <ProviderPills
        identities={identities}
        onSubmit={onSubmit}
        userProviders={erroredDiscord}
      />
    );
    const discord = screen.getByRole('button', { name: 'Reconnect Discord' });
    expect(discord).toHaveClass('bg-destructive');
    expect(discord).not.toHaveClass('bg-discord-1');
  });

  it('disables providers that are not enabled', () => {
    render(<ProviderPills identities={identities} onSubmit={onSubmit} />);
    expect(
      screen.getByRole('button', { name: 'Login with YouTube' })
    ).toBeDisabled();
  });
});
