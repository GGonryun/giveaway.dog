import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAgeField,
  buildAudience,
  buildEmailField,
  buildParticipant,
  buildProvider,
  buildSweepstakes,
  buildTwitterField,
  buildUser,
  buildUsernameField,
  renderWithParticipation,
  withStableIds
} from '@/components/sweepstakes/__tests__/fixtures';
import type { GiveawayParticipationProps } from '@/components/sweepstakes/giveaway-participation-context';
import type { SweepstakesFormFieldSchema } from '@/lib/custom-fields/schemas';
import { UserDetailsForm } from '../user-details-form';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => '/browse/summer-giveaway'
}));

vi.mock('@/lib/auth/procedures/logout', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const AGE_LABEL = 'I am at least 18 years of age (required)';

const allFields: SweepstakesFormFieldSchema[] = [
  buildUsernameField({ placeholder: 'Pick a username' }),
  buildEmailField(),
  buildAgeField({ minimum: 18, label: AGE_LABEL }),
  buildTwitterField()
];

const renderForm = (
  formFields: SweepstakesFormFieldSchema[],
  overrides: Partial<GiveawayParticipationProps> = {}
) =>
  renderWithParticipation(<UserDetailsForm />, {
    state: 'profile-incomplete',
    sweepstakes: buildSweepstakes({ audience: buildAudience({ formFields }) }),
    ...overrides
  });

const usernameInput = () => screen.getByRole('textbox', { name: /Username/ });
const emailInput = () => screen.getByRole('textbox', { name: /Email/ });
const twitterInput = () => screen.getByRole('textbox', { name: /X profile/ });
const ageCheckbox = () => screen.getByRole('checkbox', { name: AGE_LABEL });
const continueButton = () =>
  screen.getByRole('button', { name: /Continue to Sweepstakes/ });

const fillAllFields = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(usernameInput(), 'janedoe');
  await user.type(emailInput(), 'jane@example.com');
  await user.click(ageCheckbox());
  await user.type(twitterInput(), 'https://x.com/janedoe');
};

describe('UserDetailsForm', () => {
  beforeEach(() => {
    navigation.router.refresh.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it('matches the snapshot for a visitor with every field type', () => {
    const { container } = renderForm(allFields);
    expect(withStableIds(container)).toMatchSnapshot();
  });

  it('introduces the entry form', () => {
    renderForm(allFields);
    expect(
      screen.getByRole('heading', { name: 'Ready to win?' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'To participate in this sweepstakes, please complete the following entry form.'
      )
    ).toBeInTheDocument();
  });

  describe('fields', () => {
    it('marks required fields with an asterisk', () => {
      renderForm([
        buildUsernameField({ required: true }),
        buildEmailField(),
        buildTwitterField({ required: false })
      ]);
      expect(usernameInput()).toHaveAccessibleName('Username*');
      expect(emailInput()).toHaveAccessibleName('Email*');
      expect(twitterInput()).toHaveAccessibleName('X profile');
    });

    it('uses the placeholder, then the label, as the input placeholder', () => {
      renderForm([
        buildUsernameField({ placeholder: 'Pick a username' }),
        buildEmailField({ placeholder: null })
      ]);
      expect(usernameInput()).toHaveAttribute('placeholder', 'Pick a username');
      expect(emailInput()).toHaveAttribute('placeholder', 'Email');
      expect(emailInput()).toHaveAttribute('type', 'email');
    });

    it('suggests a twitter.com profile url by default', () => {
      renderForm([buildTwitterField({ placeholder: null })]);
      expect(twitterInput()).toHaveAttribute(
        'placeholder',
        'https://twitter.com/username'
      );
    });

    it('shows every field to a visitor', () => {
      renderForm(allFields);
      [usernameInput(), emailInput(), twitterInput(), ageCheckbox()].forEach(
        (input) => expect(input.closest('.hidden')).toBeNull()
      );
    });

    it('pre-fills and hides the fields that are known from the profile', () => {
      renderForm(allFields, {
        participant: buildParticipant({
          user: buildUser({
            name: 'Jane Doe',
            email: 'jane@example.com',
            birthday: new Date(1990, 0, 1),
            providers: [buildProvider({ link: 'https://x.com/janedoe' })]
          })
        })
      });
      expect(usernameInput()).toHaveValue('Jane Doe');
      expect(usernameInput().parentElement).toHaveClass('hidden');
      expect(emailInput()).toHaveValue('jane@example.com');
      expect(emailInput().parentElement).toHaveClass('hidden');
      expect(twitterInput()).toHaveValue('https://x.com/janedoe');
      expect(ageCheckbox()).toBeChecked();
      expect(ageCheckbox().closest('.hidden')).not.toBeNull();
    });

    it('pre-fills custom answers from earlier form values', () => {
      renderForm([buildTwitterField()], {
        participant: buildParticipant({
          formValues: { 'field-twitter': 'https://x.com/earlier' }
        })
      });
      expect(twitterInput()).toHaveValue('https://x.com/earlier');
      expect(twitterInput().parentElement).not.toHaveClass('hidden');
    });

    it('shows who is signed in to a participant', () => {
      renderForm(allFields, { participant: buildParticipant() });
      expect(
        screen.getByRole('link', { name: 'Jane Doe' })
      ).toBeInTheDocument();
    });

    it('does not show the sign in row to a visitor', () => {
      renderForm(allFields);
      expect(screen.queryByText('Not signed in')).not.toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('shows an error for each invalid text field', async () => {
      const user = userEvent.setup();
      const { props } = renderForm(allFields);

      await user.click(continueButton());

      expect(
        await screen.findByText('Username must be at least 1 characters')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Twitter profile is required')
      ).toBeInTheDocument();
      expect(props.onFormSubmit).not.toHaveBeenCalled();
    });

    it('rejects a twitter.com profile url even though the placeholder suggests one', async () => {
      const user = userEvent.setup();
      renderForm([buildTwitterField()]);

      await user.type(twitterInput(), 'https://twitter.com/janedoe');

      expect(
        await screen.findByText(
          'Unexpected URL, should be like https://x.com/username'
        )
      ).toBeInTheDocument();
    });

    it('rejects a username longer than 50 characters', async () => {
      const user = userEvent.setup();
      renderForm([buildUsernameField()]);

      await user.type(usernameInput(), 'a'.repeat(51));

      expect(
        await screen.findByText('Username must be at most 50 characters')
      ).toBeInTheDocument();
    });

    it('allows an optional X profile to stay empty', async () => {
      const user = userEvent.setup();
      const { props } = renderForm([buildTwitterField({ required: false })]);

      await user.click(continueButton());

      await waitFor(() =>
        expect(props.onFormSubmit).toHaveBeenCalledWith({ 'field-twitter': '' })
      );
    });

    it('blocks an empty optional username', async () => {
      const user = userEvent.setup();
      const { props } = renderForm([buildUsernameField({ required: false })]);

      await user.click(continueButton());

      expect(
        await screen.findByText('Username must be at least 1 characters')
      ).toBeInTheDocument();
      expect(props.onFormSubmit).not.toHaveBeenCalled();
    });

    it('silently blocks submission when an optional age checkbox is left unchecked', async () => {
      const user = userEvent.setup();
      const { props } = renderForm([
        buildEmailField(),
        buildAgeField({ required: false, label: AGE_LABEL })
      ]);

      await user.type(emailInput(), 'jane@example.com');
      await user.click(continueButton());

      await waitFor(() =>
        expect(ageCheckbox()).toHaveAttribute('aria-invalid', 'true')
      );
      expect(props.onFormSubmit).not.toHaveBeenCalled();
      expect(screen.queryByText(/Expected boolean/)).not.toBeInTheDocument();
    });
  });

  describe('submitting', () => {
    it('submits the answers keyed by field id', async () => {
      const user = userEvent.setup();
      const onFormSubmit = vi.fn().mockResolvedValue({});
      renderForm(allFields, { onFormSubmit });

      await fillAllFields(user);
      await user.click(continueButton());

      await waitFor(() =>
        expect(onFormSubmit).toHaveBeenCalledWith({
          'field-username': 'janedoe',
          'field-email': 'jane@example.com',
          'field-age': true,
          'field-twitter': 'https://x.com/janedoe'
        })
      );
    });

    it('submits the values from the profile without any typing', async () => {
      const user = userEvent.setup();
      const onFormSubmit = vi.fn().mockResolvedValue({});
      renderForm(allFields, {
        onFormSubmit,
        participant: buildParticipant({
          user: buildUser({
            birthday: new Date(1990, 0, 1),
            providers: [buildProvider({ link: 'https://x.com/janedoe' })]
          })
        })
      });

      await user.click(continueButton());

      await waitFor(() =>
        expect(onFormSubmit).toHaveBeenCalledWith({
          'field-username': 'Jane Doe',
          'field-email': 'jane@example.com',
          'field-age': true,
          'field-twitter': 'https://x.com/janedoe'
        })
      );
    });

    it('shows a waiting screen while the answers are submitted', async () => {
      const user = userEvent.setup();
      renderForm(allFields, {
        onFormSubmit: vi.fn(() => new Promise(() => {}))
      });

      await fillAllFields(user);
      await user.click(continueButton());

      expect(
        await screen.findByRole('heading', {
          name: 'Submitting your details...'
        })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Continue to Sweepstakes/ })
      ).not.toBeInTheDocument();
    });

    it('confirms success and refreshes the page', async () => {
      const user = userEvent.setup();
      renderForm(allFields, { onFormSubmit: vi.fn().mockResolvedValue({}) });

      await fillAllFields(user);
      await user.click(continueButton());

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'Form submitted successfully!'
        )
      );
      expect(navigation.router.refresh).toHaveBeenCalledTimes(1);
      expect(
        screen.getByRole('heading', { name: 'Submitting your details...' })
      ).toBeInTheDocument();
    });

    it('shows the server message when the submission fails', async () => {
      const user = userEvent.setup();
      renderForm(allFields, {
        onFormSubmit: vi.fn().mockRejectedValue({
          code: 'BAD_REQUEST',
          message: 'You already entered this giveaway'
        })
      });

      await fillAllFields(user);
      await user.click(continueButton());

      expect(
        await screen.findByText('You already entered this giveaway')
      ).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith(
        'You already entered this giveaway'
      );
      expect(continueButton()).toBeEnabled();
      expect(navigation.router.refresh).not.toHaveBeenCalled();
    });

    it('shows a generic message when the submission throws an unknown error', async () => {
      const user = userEvent.setup();
      const message = 'An unexpected error occurred. Please try again later.';
      renderForm(allFields, {
        onFormSubmit: vi.fn().mockRejectedValue(new TypeError('boom'))
      });

      await fillAllFields(user);
      await user.click(continueButton());

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith(message);
    });
  });
});
