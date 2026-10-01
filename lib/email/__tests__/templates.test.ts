import { describe, it, expect } from 'vitest';
import {
  getMagicLinkEmailContent,
  getMagicLinkEmailHTML,
  getMagicLinkEmailText,
  getPickerProcessedEmailContent,
  getPickerProcessedEmailHTML,
  getPickerProcessedEmailText,
  getTeamInviteEmailContent,
  getTeamInviteEmailHTML,
  getTeamInviteEmailText,
  getVerificationEmailContent,
  getVerificationEmailHTML,
  getVerificationEmailText,
  type PickerProcessedEmailOptions,
  type TeamInviteEmailOptions
} from '../templates';

const URL = 'https://giveaway.dog/verify?token=abc';

const countOccurrences = (haystack: string, needle: string) =>
  haystack.split(needle).length - 1;

const visibleText = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const pickerOptions = (
  overrides: Partial<PickerProcessedEmailOptions> = {}
): PickerProcessedEmailOptions => ({
  pickerName: 'Spring Raffle',
  eligibleParticipants: 42,
  totalParticipants: 100,
  verificationUrl: 'https://giveaway.dog/app/pickers/p-1',
  ...overrides
});

const inviteOptions = (
  overrides: Partial<TeamInviteEmailOptions> = {}
): TeamInviteEmailOptions => ({
  teamName: 'Acme',
  teamLogo: 'https://cdn.example.com/acme.png',
  role: 'ADMIN',
  inviteUrl: 'https://giveaway.dog/invite/xyz',
  recipientEmail: 'invitee@example.com',
  ...overrides
});

describe('verification email', () => {
  describe('getVerificationEmailHTML', () => {
    it('greets the recipient by name when a name is provided', () => {
      const html = getVerificationEmailHTML({ url: URL, name: 'Ada' });

      expect(html).toContain('🐶 Hello Ada, from');
    });

    it('uses a generic greeting when the name is missing', () => {
      const html = getVerificationEmailHTML({ url: URL });

      expect(html).toContain('🐶 Hello from');
      expect(html).not.toContain('Hello undefined');
    });

    it('uses a generic greeting when the name is an empty string', () => {
      const html = getVerificationEmailHTML({ url: URL, name: '' });

      expect(html).toContain('🐶 Hello from');
    });

    it('embeds the url in the button href, the fallback href and the visible link', () => {
      const html = getVerificationEmailHTML({ url: URL });

      expect(countOccurrences(html, URL)).toBe(3);
      expect(html).toContain(`<a href="${URL}" `);
      expect(html).toContain(`>${URL}</a>`);
    });

    it('renders a complete html document with the verify call to action', () => {
      const html = getVerificationEmailHTML({ url: URL });

      expect(html.trim().startsWith('<!DOCTYPE html>')).toBe(true);
      expect(html.trim().endsWith('</html>')).toBe(true);
      expect(html).toContain('Verify Email');
      expect(html).toContain(
        'Please verify your email address by clicking the button below.'
      );
      expect(html).toContain(
        "If you didn't request this, you can safely ignore this email."
      );
    });

    it('renders exactly the expected visible text', () => {
      expect(
        visibleText(getVerificationEmailHTML({ url: URL, name: 'Ada' }))
      ).toBe(
        `🐶 Hello Ada, from Giveaway.Dog ! Please verify your email address by clicking the button below. Verify Email Or copy and paste this link into your browser: ${URL} If you didn't request this, you can safely ignore this email.`
      );
    });

    it('interpolates the name without html escaping', () => {
      const html = getVerificationEmailHTML({
        url: URL,
        name: '<b>Ada</b>'
      });

      expect(html).toContain('Hello <b>Ada</b>,');
    });
  });

  describe('getVerificationEmailText', () => {
    it('renders the exact plain text body with a name', () => {
      expect(getVerificationEmailText({ url: URL, name: 'Ada' })).toBe(
        `Hello Ada! 🐶\n\nPlease verify your email address by visiting the link below:\n${URL}\n\nIf you didn't request this, you can safely ignore this message.\n`
      );
    });

    it('renders a generic greeting without a name', () => {
      expect(getVerificationEmailText({ url: URL })).toBe(
        `Hello! 🐶\n\nPlease verify your email address by visiting the link below:\n${URL}\n\nIf you didn't request this, you can safely ignore this message.\n`
      );
    });
  });

  describe('getVerificationEmailContent', () => {
    it('returns the subject together with the html and text bodies', () => {
      const options = { url: URL, name: 'Ada' };

      expect(getVerificationEmailContent(options)).toEqual({
        subject: 'Verify your email - Giveaway.Dog',
        html: getVerificationEmailHTML(options),
        text: getVerificationEmailText(options)
      });
    });
  });
});

describe('magic link email', () => {
  describe('getMagicLinkEmailHTML', () => {
    it('greets the recipient by name when a name is provided', () => {
      const html = getMagicLinkEmailHTML({ url: URL, name: 'Ada' });

      expect(html).toContain('🐶 Hey Ada,</h1>');
    });

    it('uses a generic greeting when the name is missing', () => {
      const html = getMagicLinkEmailHTML({ url: URL });

      expect(html).toContain('🐶 Hey there,</h1>');
    });

    it('renders exactly the expected visible text', () => {
      expect(
        visibleText(getMagicLinkEmailHTML({ url: URL, name: 'Ada' }))
      ).toBe(
        `🐶 Hey Ada, Use the button below to sign in to your Giveaway.Dog account. Sign In to Giveaway.Dog Or copy and paste this link into your browser: ${URL} This link will expire soon and can only be used once for security reasons.`
      );
    });

    it('embeds the url three times and the sign in call to action', () => {
      const html = getMagicLinkEmailHTML({ url: URL });

      expect(countOccurrences(html, URL)).toBe(3);
      expect(html).toContain('Sign In to Giveaway.Dog');
      expect(html).toContain(
        'This link will expire soon and can only be used once for security reasons.'
      );
    });
  });

  describe('getMagicLinkEmailText', () => {
    it('renders the exact plain text body with a name and no trailing newline', () => {
      expect(getMagicLinkEmailText({ url: URL, name: 'Ada' })).toBe(
        `Hey Ada! 🐶\n\nUse the link below to sign in to your Giveaway.Dog account:\n${URL}\n\nThis link will expire soon and can only be used once for security reasons.`
      );
    });

    it('renders a generic greeting without a name', () => {
      expect(getMagicLinkEmailText({ url: URL })).toMatch(/^Hey there! 🐶\n/);
    });
  });

  describe('getMagicLinkEmailContent', () => {
    it('returns the magic link subject together with the html and text bodies', () => {
      const options = { url: URL };

      expect(getMagicLinkEmailContent(options)).toEqual({
        subject: 'Your Magic Sign-In Link ✨ - Giveaway.Dog',
        html: getMagicLinkEmailHTML(options),
        text: getMagicLinkEmailText(options)
      });
    });
  });
});

describe('picker processed email', () => {
  describe('getPickerProcessedEmailHTML', () => {
    it('greets the recipient by name when a name is provided', () => {
      const html = getPickerProcessedEmailHTML(pickerOptions({ name: 'Ada' }));

      expect(html).toContain('🎉 Hey Ada,</h1>');
    });

    it('uses a generic greeting when the name is missing', () => {
      const html = getPickerProcessedEmailHTML(pickerOptions());

      expect(html).toContain('🎉 Hey there,</h1>');
    });

    it('renders the quoted picker name and the participant counts', () => {
      const html = getPickerProcessedEmailHTML(pickerOptions());

      expect(html).toContain('"Spring Raffle"');
      expect(html).toContain('<strong>📊 Total Participants:</strong> 100');
      expect(html).toContain('<strong>✅ Eligible Participants:</strong> 42');
    });

    it('renders zero participant counts', () => {
      const html = getPickerProcessedEmailHTML(
        pickerOptions({ eligibleParticipants: 0, totalParticipants: 0 })
      );

      expect(html).toContain('Total Participants:</strong> 0');
      expect(html).toContain('Eligible Participants:</strong> 0');
    });

    it('embeds the verification url three times', () => {
      const options = pickerOptions();
      const html = getPickerProcessedEmailHTML(options);

      expect(countOccurrences(html, options.verificationUrl)).toBe(3);
      expect(html).toContain('Select Winners');
    });

    it('renders exactly the expected visible text', () => {
      expect(
        visibleText(getPickerProcessedEmailHTML(pickerOptions({ name: 'Ada' })))
      ).toBe(
        `🎉 Hey Ada, Your picker is ready! "Spring Raffle" 📊 Total Participants: 100 ✅ Eligible Participants: 42 All participants have been processed and verified! You're now ready to select and notify the winners. Select Winners Or copy and paste this link into your browser: https://giveaway.dog/app/pickers/p-1 Next Steps: Click the button above to go to your giveaway Review the eligible participants Select the number of winners to draw Share the results with participants Powered by Giveaway.Dog 🐶`
      );
    });

    it('lists four next steps', () => {
      const html = getPickerProcessedEmailHTML(pickerOptions());

      expect(countOccurrences(html, '<li>')).toBe(4);
      expect(html).toContain(
        '<li>Click the button above to go to your giveaway</li>'
      );
    });
  });

  describe('getPickerProcessedEmailText', () => {
    it('renders the exact plain text body with a name', () => {
      expect(getPickerProcessedEmailText(pickerOptions({ name: 'Ada' })))
        .toBe(`Hey Ada! 🎉

Your picker is ready: "Spring Raffle"

PROCESSING COMPLETE
==================
📊 Total Participants: 100
✅ Eligible Participants: 42

All participants have been processed and verified!
You're now ready to select and notify the winners.

SELECT WINNERS
==============
Click the link below to select your winners:
https://giveaway.dog/app/pickers/p-1

NEXT STEPS
==========
1. Review the eligible participants
2. Select the number of winners to draw
3. Share the results with participants

---
Powered by Giveaway.Dog 🐶
`);
    });

    it('renders a generic greeting without a name', () => {
      expect(getPickerProcessedEmailText(pickerOptions())).toMatch(
        /^Hey there! 🎉\n/
      );
    });

    it('lists only three next steps unlike the html version', () => {
      const text = getPickerProcessedEmailText(pickerOptions());

      expect(text).toContain('3. Share the results with participants');
      expect(text).not.toContain('4.');
      expect(text).not.toContain('Click the button above');
    });
  });

  describe('getPickerProcessedEmailContent', () => {
    it('includes the picker name in the subject', () => {
      const options = pickerOptions();

      expect(getPickerProcessedEmailContent(options)).toEqual({
        subject: '🎉 Your picker "Spring Raffle" is ready! - Giveaway.Dog',
        html: getPickerProcessedEmailHTML(options),
        text: getPickerProcessedEmailText(options)
      });
    });
  });
});

describe('team invite email', () => {
  describe('getTeamInviteEmailHTML', () => {
    it('names the inviter when one is provided', () => {
      const html = getTeamInviteEmailHTML(
        inviteOptions({ inviterName: 'Grace' })
      );

      expect(html).toContain(
        'Grace has invited you to join <strong style="color:#ff7b00;">Acme</strong>'
      );
    });

    it('uses a passive invitation when no inviter is provided', () => {
      const html = getTeamInviteEmailHTML(inviteOptions());

      expect(html).toContain(
        'You\'ve been invited to join <strong style="color:#ff7b00;">Acme</strong>'
      );
    });

    it('uses a passive invitation when the inviter name is empty', () => {
      const html = getTeamInviteEmailHTML(inviteOptions({ inviterName: '' }));

      expect(html).toContain("You've been invited to join");
    });

    it('renders exactly the expected visible text', () => {
      expect(
        visibleText(
          getTeamInviteEmailHTML(inviteOptions({ inviterName: 'Grace' }))
        )
      ).toBe(
        `Team Invitation Grace has invited you to join Acme Your Role: ADMIN Click the button below to accept the invitation and join the team. Accept Invitation Or copy and paste this link into your browser: https://giveaway.dog/invite/xyz If you don't want to join this team, you can safely ignore this email. Powered by Giveaway.Dog 🐶`
      );
    });

    it('renders the team logo with an alt text based on the team name', () => {
      const html = getTeamInviteEmailHTML(inviteOptions());

      expect(html).toContain(
        '<img src="https://cdn.example.com/acme.png" alt="Acme logo"'
      );
    });

    it('renders the role and embeds the invite url three times', () => {
      const options = inviteOptions();
      const html = getTeamInviteEmailHTML(options);

      expect(html).toContain('font-weight: bold;">ADMIN</span>');
      expect(countOccurrences(html, options.inviteUrl)).toBe(3);
      expect(html).toContain('Accept Invitation');
    });

    it('does not include the recipient email', () => {
      const html = getTeamInviteEmailHTML(inviteOptions());

      expect(html).not.toContain('invitee@example.com');
    });

    it('interpolates the team name without html escaping', () => {
      const html = getTeamInviteEmailHTML(
        inviteOptions({ teamName: '<script>x</script>' })
      );

      expect(html).toContain(
        '<strong style="color:#ff7b00;"><script>x</script>'
      );
    });
  });

  describe('getTeamInviteEmailText', () => {
    it('renders the exact plain text body with an inviter', () => {
      expect(getTeamInviteEmailText(inviteOptions({ inviterName: 'Grace' })))
        .toBe(`🐶 Team Invitation - Giveaway.Dog

Grace has invited you to join "Acme"

YOUR ROLE
=========
ADMIN

ACCEPT INVITATION
=================
Click the link below to accept the invitation and join the team:
https://giveaway.dog/invite/xyz

If you don't want to join this team, you can safely ignore this email.

---
Powered by Giveaway.Dog 🐶
`);
    });

    it('uses a passive invitation without an inviter', () => {
      expect(getTeamInviteEmailText(inviteOptions())).toContain(
        `You've been invited to join "Acme"`
      );
    });

    it('omits the team logo and recipient email', () => {
      const text = getTeamInviteEmailText(inviteOptions());

      expect(text).not.toContain('acme.png');
      expect(text).not.toContain('invitee@example.com');
    });
  });

  describe('getTeamInviteEmailContent', () => {
    it('includes the team name in the subject', () => {
      const options = inviteOptions({ inviterName: 'Grace' });

      expect(getTeamInviteEmailContent(options)).toEqual({
        subject: "You've been invited to join Acme - Giveaway.Dog",
        html: getTeamInviteEmailHTML(options),
        text: getTeamInviteEmailText(options)
      });
    });
  });
});
