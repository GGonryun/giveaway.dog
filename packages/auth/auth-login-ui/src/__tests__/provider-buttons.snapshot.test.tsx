import { render } from '@testing-library/react';
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

  it('matches the snapshot', () => {
    const { container } = render(
      <ProviderButtons
        identities={identities}
        onSubmit={onSubmit}
        userProviders={erroredDiscord}
        lastUsedProvider="GOOGLE"
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('ProviderIcons', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    onSubmit.mockReset();
  });

  it('matches the snapshot', () => {
    const { container } = render(
      <ProviderIcons
        identities={identities}
        onSubmit={onSubmit}
        userProviders={erroredDiscord}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('ProviderDots', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    onSubmit.mockReset();
  });

  it('matches the snapshot', () => {
    const { container } = render(
      <ProviderDots
        identities={['GOOGLE', 'DISCORD']}
        onSubmit={onSubmit}
        userProviders={erroredDiscord}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('ProviderPills', () => {
  const onSubmit = vi.fn();

  beforeEach(() => {
    onSubmit.mockReset();
  });

  it('matches the snapshot', () => {
    const { container } = render(
      <ProviderPills
        identities={['GOOGLE', 'DISCORD']}
        onSubmit={onSubmit}
        userProviders={erroredDiscord}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
