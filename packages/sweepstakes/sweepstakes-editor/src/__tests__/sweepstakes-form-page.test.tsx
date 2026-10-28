import { render, screen } from '@testing-library/react';
import { notFound, redirect } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTeamIntegrations } from '@giveaway/integration-server/get-team-integrations';
import { getPublishedSweepstakes } from '@giveaway/sweepstakes-editor-server/get-published-sweepstakes';
import getSweepstakesForm from '@giveaway/sweepstakes-editor-server/get-sweepstakes-form';
import getSweepstakesStatus from '@giveaway/sweepstakes-editor-server/get-sweepstakes-status';
import { SweepstakesForm } from '../sweepstakes-form';
import { DerivedSweepstakeStatus } from '@giveaway/sweepstakes-model/sweepstakes';
import { ApplicationErrorCode } from '@giveaway/util-errors';
import {
  SweepstakeCreateFormPage,
  SweepstakeFormPage
} from '../sweepstakes-form-page';
import { buildFormValues } from '@giveaway/sweepstakes-editor-setup/testing/form-harness';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  })
}));

vi.mock('@giveaway/sweepstakes-editor-server/get-sweepstakes-form', () => ({
  default: vi.fn()
}));

vi.mock('@giveaway/sweepstakes-editor-server/get-sweepstakes-status', () => ({
  default: vi.fn()
}));

vi.mock('@giveaway/integration-server/get-team-integrations', () => ({
  getTeamIntegrations: vi.fn()
}));

vi.mock(
  '@giveaway/sweepstakes-editor-server/get-published-sweepstakes',
  () => ({
    getPublishedSweepstakes: vi.fn()
  })
);

vi.mock('../sweepstakes-form', () => ({
  SweepstakesForm: vi.fn(() => <div>Sweepstakes form</div>)
}));

const formData = { ...buildFormValues(), id: 'sweepstakes-1' };

const failure = (code: ApplicationErrorCode) => ({
  ok: false as const,
  data: { code, message: code }
});

const succeed = (status: DerivedSweepstakeStatus = 'DRAFT') => {
  vi.mocked(getSweepstakesForm).mockResolvedValue({ ok: true, data: formData });
  vi.mocked(getSweepstakesStatus).mockResolvedValue({
    ok: true,
    data: { id: 'sweepstakes-1', status }
  });
  vi.mocked(getTeamIntegrations).mockResolvedValue({ ok: true, data: [] });
  vi.mocked(getPublishedSweepstakes).mockResolvedValue({
    ok: true,
    data: { count: 4 }
  });
};

const renderPage = async () => {
  const page = await SweepstakeFormPage({
    params: Promise.resolve({ id: 'sweepstakes-1', slug: 'acme' })
  });
  return render(page);
};

describe('SweepstakeFormPage', () => {
  beforeEach(() => {
    vi.mocked(notFound).mockClear();
    vi.mocked(redirect).mockClear();
    vi.mocked(SweepstakesForm).mockClear();
    succeed('RUNNING');
  });

  it('loads the form, status, integrations and published count', async () => {
    await renderPage();
    expect(getSweepstakesForm).toHaveBeenCalledWith({ id: 'sweepstakes-1' });
    expect(getSweepstakesStatus).toHaveBeenCalledWith({ id: 'sweepstakes-1' });
    expect(getTeamIntegrations).toHaveBeenCalledWith({ slug: 'acme' });
    expect(getPublishedSweepstakes).toHaveBeenCalledWith({ slug: 'acme' });
  });

  describe('when everything loads', () => {
    it.each(['RUNNING', 'SCHEDULED', 'EXPIRED', 'ERROR'] as const)(
      'renders the editor for a %s sweepstakes',
      async (status) => {
        succeed(status);
        await renderPage();
        expect(screen.getByText('Sweepstakes form')).toBeInTheDocument();
        expect(redirect).not.toHaveBeenCalled();
      }
    );

    it('sends a draft to the create page', async () => {
      succeed('DRAFT');
      await expect(renderPage()).rejects.toThrow(
        'NEXT_REDIRECT /app/acme/sweepstakes/sweepstakes-1/create'
      );
      expect(SweepstakesForm).not.toHaveBeenCalled();
    });

    it('passes the form, integrations and loyalty limit to the editor', async () => {
      await renderPage();
      expect(vi.mocked(SweepstakesForm).mock.lastCall?.[0]).toEqual({
        sweepstakes: formData,
        integrations: [],
        maxLoyalty: 4
      });
    });
  });

  describe('when the form cannot be loaded', () => {
    it('shows the not found page for a missing sweepstakes', async () => {
      vi.mocked(getSweepstakesForm).mockResolvedValue(failure('NOT_FOUND'));
      await expect(renderPage()).rejects.toThrow('NEXT_NOT_FOUND');
      expect(notFound).toHaveBeenCalled();
    });

    it('shows the error code for other failures', async () => {
      vi.mocked(getSweepstakesForm).mockResolvedValue(failure('FORBIDDEN'));
      await renderPage();
      expect(
        screen.getByText('Failed to load sweepstakes form: FORBIDDEN')
      ).toBeInTheDocument();
      expect(SweepstakesForm).not.toHaveBeenCalled();
    });
  });

  describe('when the status cannot be loaded', () => {
    it('shows the not found page for a missing sweepstakes', async () => {
      vi.mocked(getSweepstakesStatus).mockResolvedValue(failure('NOT_FOUND'));
      await expect(renderPage()).rejects.toThrow('NEXT_NOT_FOUND');
    });

    it('shows the error code for other failures', async () => {
      vi.mocked(getSweepstakesStatus).mockResolvedValue(
        failure('INTERNAL_SERVER_ERROR')
      );
      await renderPage();
      expect(
        screen.getByText(
          'Failed to load sweepstakes info: INTERNAL_SERVER_ERROR'
        )
      ).toBeInTheDocument();
    });
  });

  it('shows the error code when the integrations cannot be loaded', async () => {
    vi.mocked(getTeamIntegrations).mockResolvedValue(failure('UNAUTHORIZED'));
    await renderPage();
    expect(
      screen.getByText('Failed to load integrations: UNAUTHORIZED')
    ).toBeInTheDocument();
  });

  it('refuses to edit a completed sweepstakes', async () => {
    succeed('COMPLETED');
    await renderPage();
    expect(
      screen.getByText('Sweepstakes with status "COMPLETED" cannot be edited.')
    ).toBeInTheDocument();
    expect(SweepstakesForm).not.toHaveBeenCalled();
  });

  it('shows the error code when the published count cannot be loaded', async () => {
    vi.mocked(getPublishedSweepstakes).mockResolvedValue(failure('TIMEOUT'));
    await renderPage();
    expect(
      screen.getByText('Failed to load completed sweepstakes count: TIMEOUT')
    ).toBeInTheDocument();
  });

  it('reports a completed sweepstakes before a missing published count', async () => {
    succeed('COMPLETED');
    vi.mocked(getPublishedSweepstakes).mockResolvedValue(failure('TIMEOUT'));
    await renderPage();
    expect(
      screen.getByText('Sweepstakes with status "COMPLETED" cannot be edited.')
    ).toBeInTheDocument();
  });
});

describe('SweepstakeCreateFormPage', () => {
  const renderCreatePage = async () => {
    const page = await SweepstakeCreateFormPage({
      params: Promise.resolve({ id: 'sweepstakes-1', slug: 'acme' })
    });
    return render(page);
  };

  beforeEach(() => {
    vi.mocked(redirect).mockClear();
    vi.mocked(SweepstakesForm).mockClear();
    succeed();
  });

  it('renders the editor for a draft', async () => {
    await renderCreatePage();
    expect(screen.getByText('Sweepstakes form')).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it.each(['RUNNING', 'SCHEDULED', 'EXPIRED', 'ERROR', 'COMPLETED'] as const)(
    'sends a %s sweepstakes to the edit page',
    async (status) => {
      succeed(status);
      await expect(renderCreatePage()).rejects.toThrow(
        'NEXT_REDIRECT /app/acme/sweepstakes/sweepstakes-1/edit'
      );
      expect(SweepstakesForm).not.toHaveBeenCalled();
    }
  );

  it('does not redirect when the edit page renders a published sweepstakes', async () => {
    succeed('RUNNING');
    await renderPage();
    expect(redirect).not.toHaveBeenCalled();
  });
});
