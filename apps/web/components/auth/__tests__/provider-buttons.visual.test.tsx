import { IdentityProvider } from '@prisma/client';
import { describe, expect, test, vi } from 'vitest';
import { ProviderSchema } from '@/lib/integrations/schemas/providers';
import { renderVisual, THEMES } from '@giveaway/testing-visual/render';
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

describe.each(THEMES)('Provider buttons (%s)', (theme) => {
  test('buttons', async () => {
    const root = await renderVisual(
      <ProviderButtons
        identities={identities}
        onSubmit={vi.fn()}
        userProviders={erroredDiscord}
        lastUsedProvider="GOOGLE"
      />,
      { theme, width: 400 }
    );
    await expect.element(root).toMatchScreenshot();
  });

  test('icons, pills and dots', async () => {
    const root = await renderVisual(
      <div className="flex flex-col gap-4">
        <ProviderIcons
          identities={identities}
          onSubmit={vi.fn()}
          userProviders={erroredDiscord}
        />
        <ProviderPills
          identities={identities}
          onSubmit={vi.fn()}
          userProviders={erroredDiscord}
        />
        <ProviderDots
          identities={identities}
          onSubmit={vi.fn()}
          userProviders={erroredDiscord}
        />
      </div>,
      { theme, width: 400 }
    );
    await expect.element(root).toMatchScreenshot();
  });
});
