import { render, screen } from '@testing-library/react';
import React from 'react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MockTeamProvider } from '@giveaway/team-context/mock-team-provider';
import deleteSweepstakes from '@/procedures/sweepstakes/delete-sweepstakes';
import publishSweepstakes from '@/procedures/sweepstakes/publish-sweepstakes';
import updateSweepstakes from '@/procedures/sweepstakes/update-sweepstakes';
import { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';
import { SweepstakesForm } from '../sweepstakes-form';
import { buildFormValues, FIXED_NOW } from './form-harness';
import { stabilizeIds } from '@giveaway/testing-dom/stable-dom';

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
    it.each([
      ['create', '/app/demo-team/sweepstakes/sweepstakes-1/create'],
      ['edit', '/app/demo-team/sweepstakes/sweepstakes-1/edit']
    ])('matches the snapshot of the header when %s', (_, pathname) => {
      renderForm({ pathname });
      expect(stabilizeIds(screen.getByRole('banner'))).toMatchSnapshot();
    });
  });
});
