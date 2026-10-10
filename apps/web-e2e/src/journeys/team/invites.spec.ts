import { toE2ePersonaEmail } from '@giveaway/e2e-model/personas';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET } from '../../env';
import { fakesOf, linkInEmail, waitForEmail } from '../../helpers/outbox';
import { signInAs } from '../../helpers/personas';
import { seedApi } from '../../helpers/seed';

test.describe('team invites', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test('a member joins with the link from the invite email', async ({
    page,
    request,
    freshPersona
  }) => {
    const seed = seedApi(request);
    const fakes = fakesOf(await seed.health());
    test.skip(!fakes.includes('email'), 'Set E2E_FAKE_EXTERNALS to email');
    const host = await freshPersona('host');
    const { team } = await seed.team({ ns: host.ns, suffix: 'inv' });
    const invitee = toE2ePersonaEmail('member', host.ns);

    await page.goto(`/app/${team.slug}/settings/team`);
    await page.getByRole('textbox', { name: 'Email Address' }).fill(invitee);
    await page.getByRole('button', { name: 'Send Invitations' }).click();
    await expect(page.getByText('Invited 1 member successfully')).toBeVisible({
      timeout: 30_000
    });

    const message = await waitForEmail(request, invitee, /invited to join/);
    const link = linkInEmail(message, '/invites/');
    await signInAs(page.request, 'member', host.ns);
    await page.goto(link);
    await page.getByRole('button', { name: 'Accept Invitation' }).click();
    await expect(page.getByText('Welcome to the Team!')).toBeVisible();

    const { members } = await seed.teamRows(team.slug);
    expect(members).toContainEqual(
      expect.objectContaining({ email: invitee, role: 'MEMBER' })
    );
  });
});
