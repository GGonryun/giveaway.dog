import {
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MockTeamProvider } from '@giveaway/team-context/mock-team-provider';
import deleteSweepstakes from '@/procedures/sweepstakes/delete-sweepstakes';
import publishSweepstakes from '@/procedures/sweepstakes/publish-sweepstakes';
import updateSweepstakes from '@/procedures/sweepstakes/update-sweepstakes';
import { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';
import { SweepstakesForm } from '../sweepstakes-form';
import {
  buildFormValues,
  FIXED_NOW
} from '@giveaway/sweepstakes-editor-setup/testing/form-harness';

vi.hoisted(() => {
  process.env.TZ = 'UTC';
});

const navigation = vi.hoisted(() => ({
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn()
  },
  pathname: '/app/demo-team/sweepstakes/sweepstakes-1/create',
  searchParams: new URLSearchParams(),
  params: { id: 'sweepstakes-1', slug: 'demo-team' } as Record<string, string>
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams,
  useParams: () => navigation.params
}));

vi.mock('next/link', () => ({
  default: (
    props: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string;
      shallow?: boolean;
      prefetch?: boolean;
      scroll?: boolean;
    }
  ) => {
    const anchorProps = { ...props };
    delete anchorProps.shallow;
    delete anchorProps.prefetch;
    delete anchorProps.scroll;
    return <a {...anchorProps} />;
  }
}));

vi.mock('@giveaway/util-time/time', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@giveaway/util-time/time')>();
  const zones = ['Pacific/Honolulu', 'Atlantic/Reykjavik', 'Asia/Tokyo'];
  return {
    ...actual,
    timezone: {
      ...actual.timezone,
      options: actual.timezone.options.filter((option) =>
        zones.includes(option.zone)
      )
    }
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() }
}));

vi.mock('@/procedures/sweepstakes/update-sweepstakes', () => ({
  default: vi.fn()
}));

vi.mock('@/procedures/sweepstakes/publish-sweepstakes', () => ({
  default: vi.fn()
}));

vi.mock('@/procedures/sweepstakes/delete-sweepstakes', () => ({
  default: vi.fn()
}));

vi.mock('@/procedures/sweepstakes/verify-slug', () => ({ default: vi.fn() }));

vi.mock('@/components/sweepstakes/giveaway-participation', () => ({
  GiveawayParticipation: () => <div>Giveaway preview</div>
}));

vi.mock('@giveaway/ui-rich-text/minimal-tiptap-editor', () => ({
  MinimalTiptap: ({ placeholder }: { placeholder?: string }) => (
    <textarea aria-label={placeholder} />
  )
}));

vi.mock('@giveaway/ui-file-upload/file-upload', () => ({
  FileUpload: () => <div>Banner upload</div>
}));

const succeed = { ok: true as const, data: { slug: 'summer' } };

const renderForm = ({
  pathname = '/app/demo-team/sweepstakes/sweepstakes-1/create',
  step,
  params = { id: 'sweepstakes-1', slug: 'demo-team' },
  values = buildFormValues(),
  isDemo
}: {
  pathname?: string;
  step?: string;
  params?: Record<string, string>;
  values?: GiveawayFormSchema;
  isDemo?: boolean;
} = {}) => {
  navigation.pathname = pathname;
  navigation.params = params;
  navigation.searchParams = new URLSearchParams(step ? { step } : {});
  return render(
    <MockTeamProvider>
      <SweepstakesForm
        sweepstakes={values}
        integrations={[]}
        maxLoyalty={0}
        isDemo={isDemo}
      />
    </MockTeamProvider>
  );
};

const editPath = '/app/demo-team/sweepstakes/sweepstakes-1/edit';

const getHeaderButton = (name: string) =>
  within(screen.getByRole('banner')).getByRole('button', { name });

describe('SweepstakesForm', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_NOW);
    vi.mocked(updateSweepstakes).mockReset().mockResolvedValue(succeed);
    vi.mocked(publishSweepstakes).mockReset().mockResolvedValue(succeed);
    vi.mocked(deleteSweepstakes).mockReset().mockResolvedValue(succeed);
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.info).mockClear();
    navigation.router.push.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.history.replaceState({}, '', '/');
  });

  describe('layout', () => {
    it('rejects a missing sweepstakes id outside of the demo', () => {
      renderForm({ params: { slug: 'demo-team' } });
      expect(screen.getByText(/Invalid ID:/)).toBeInTheDocument();
      expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    });

    it('allows a missing sweepstakes id in the demo', () => {
      renderForm({ params: { slug: 'demo-team' }, isDemo: true });
      expect(screen.queryByText(/Invalid ID:/)).not.toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('shows the sweepstakes name in the header', () => {
      renderForm();
      expect(
        screen.getByRole('heading', { level: 1, name: 'Summer Giveaway' })
      ).toBeInTheDocument();
    });

    it('shows a tab for each step', () => {
      renderForm();
      expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
        'Setup',
        'Audience',
        'Tasks',
        'Selection',
        'Prizes',
        'Design'
      ]);
      expect(screen.getByRole('tab', { name: 'Setup' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('opens the step from the URL', () => {
      renderForm({ step: 'prizes' });
      expect(screen.getByRole('tab', { name: 'Prizes' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(
        screen.getByRole('heading', { level: 2, name: 'Prizes' })
      ).toBeInTheDocument();
    });

    it('falls back to the setup step for an unknown step', () => {
      renderForm({ step: 'summary' });
      expect(
        screen.getByRole('heading', { level: 2, name: 'Setup' })
      ).toBeInTheDocument();
    });

    it('moves to the next step from the footer', async () => {
      renderForm();
      await userEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(
        screen.getByRole('heading', { level: 2, name: 'Identity' })
      ).toBeInTheDocument();
      expect(window.location.search).toBe('?step=audience');
    });

    it('shows the preview with its state picker', () => {
      renderForm();
      expect(screen.getByText('Giveaway preview')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Active State' })
      ).toBeInTheDocument();
    });
  });

  describe('when creating a sweepstakes', () => {
    it('publishes the sweepstakes after confirmation', async () => {
      const values = buildFormValues();
      renderForm({ values });
      await userEvent.click(getHeaderButton('Publish'));

      const dialog = await screen.findByRole('dialog', {
        name: 'Ready to Publish?'
      });
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Publish Now' })
      );

      await waitFor(() =>
        expect(publishSweepstakes).toHaveBeenCalledWith({
          id: 'sweepstakes-1',
          ...values
        })
      );
      await waitFor(() =>
        expect(navigation.router.push).toHaveBeenCalledWith('/app/demo-team')
      );
      expect(toast.success).toHaveBeenCalledWith(
        'Sweepstakes published successfully!'
      );
    });

    it('lists the problems instead of publishing an invalid sweepstakes', async () => {
      renderForm({
        values: buildFormValues({
          setup: { name: 'ab', description: 'Win', banner: '' }
        })
      });
      await userEvent.click(getHeaderButton('Publish'));

      const dialog = await screen.findByRole('dialog', {
        name: 'There are some problems'
      });
      expect(dialog).toHaveTextContent('setup.name');
      expect(dialog).toHaveTextContent(
        'issue need to be fixed before you can publish'
      );
      expect(publishSweepstakes).not.toHaveBeenCalled();
    });

    it('asks before leaving the draft', async () => {
      renderForm();
      await userEvent.click(getHeaderButton('Cancel'));

      const dialog = screen.getByRole('dialog', {
        name: "You're exiting the Sweepstakes Editor"
      });
      expect(
        within(dialog).getByRole('button', { name: 'Delete Draft' })
      ).toBeInTheDocument();
      expect(
        within(dialog).getByRole('button', { name: 'Save & Exit' })
      ).toBeInTheDocument();
    });

    it('deletes the draft and returns to the sweepstakes list', async () => {
      renderForm();
      await userEvent.click(getHeaderButton('Cancel'));
      await userEvent.click(
        screen.getByRole('button', { name: 'Delete Draft' })
      );

      await waitFor(() =>
        expect(deleteSweepstakes).toHaveBeenCalledWith({ id: 'sweepstakes-1' })
      );
      await waitFor(() =>
        expect(navigation.router.push).toHaveBeenCalledWith('/app/demo-team')
      );
      expect(toast.success).toHaveBeenCalledWith(
        'Sweepstakes deleted successfully!'
      );
    });

    it('saves the draft and returns to the sweepstakes list', async () => {
      const values = buildFormValues();
      renderForm({ values });
      await userEvent.click(getHeaderButton('Cancel'));
      await userEvent.click(
        screen.getByRole('button', { name: 'Save & Exit' })
      );

      await waitFor(() =>
        expect(updateSweepstakes).toHaveBeenCalledWith({
          id: 'sweepstakes-1',
          ...values
        })
      );
      await waitFor(() =>
        expect(navigation.router.push).toHaveBeenCalledWith('/app/demo-team')
      );
    });
  });

  describe('when editing a sweepstakes', () => {
    const detailsPage = '/app/demo-team/sweepstakes/sweepstakes-1';

    it('saves the changes after confirmation', async () => {
      const values = buildFormValues();
      renderForm({ pathname: editPath, values });
      await userEvent.click(getHeaderButton('Save Changes'));

      const dialog = await screen.findByRole('dialog', {
        name: 'Save Changes?'
      });
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Confirm' })
      );

      await waitFor(() =>
        expect(updateSweepstakes).toHaveBeenCalledWith({
          id: 'sweepstakes-1',
          ...values
        })
      );
      await waitFor(() =>
        expect(navigation.router.push).toHaveBeenCalledWith(detailsPage)
      );
      expect(publishSweepstakes).not.toHaveBeenCalled();
    });

    it('leaves without asking when nothing changed', async () => {
      renderForm({ pathname: editPath });
      await userEvent.click(getHeaderButton('Cancel'));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(navigation.router.push).toHaveBeenCalledWith(detailsPage);
    });

    it('asks before discarding unsaved changes', async () => {
      renderForm({ pathname: editPath });
      fireEvent.change(screen.getByLabelText('Name'), {
        target: { value: 'Summer Giveaway!' }
      });
      await userEvent.click(getHeaderButton('Cancel'));

      await userEvent.click(
        screen.getByRole('button', { name: 'Discard Changes' })
      );
      expect(navigation.router.push).toHaveBeenCalledWith(detailsPage);
      expect(deleteSweepstakes).not.toHaveBeenCalled();
    });
  });

  describe('in the demo', () => {
    it('explains the demo mode', () => {
      renderForm({ isDemo: true });
      expect(screen.getByText('Demo Mode')).toBeInTheDocument();
    });

    it('labels the submit button as saving changes', () => {
      renderForm({ isDemo: true });
      expect(getHeaderButton('Save Changes')).toBeInTheDocument();
      expect(
        within(screen.getByRole('banner')).queryByRole('button', {
          name: 'Publish'
        })
      ).not.toBeInTheDocument();
    });

    it('does not save from the confirmation', async () => {
      renderForm({ isDemo: true });
      await userEvent.click(getHeaderButton('Save Changes'));

      const dialog = await screen.findByRole('dialog', {
        name: 'Save Changes?'
      });
      expect(within(dialog).getByRole('alert')).toHaveTextContent(
        'Publishing and saving are not available in the demo.'
      );
      expect(
        within(dialog).queryByRole('button', { name: 'Confirm' })
      ).not.toBeInTheDocument();
      expect(publishSweepstakes).not.toHaveBeenCalled();
      expect(updateSweepstakes).not.toHaveBeenCalled();
    });

    it('asks before leaving the demo', async () => {
      renderForm({ isDemo: true });
      await userEvent.click(getHeaderButton('Cancel'));

      const dialog = screen.getByRole('dialog', {
        name: "You're exiting the Sweepstakes Editor"
      });
      expect(within(dialog).getByRole('alert')).toHaveTextContent(
        'Saving and deleting are not available in the demo.'
      );
      expect(
        within(dialog).queryByRole('button', { name: 'Delete Draft' })
      ).not.toBeInTheDocument();
    });
  });
});
