import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTeamIntegrations } from '@giveaway/integration-server/get-team-integrations';
import { getPublishedSweepstakes } from '@/procedures/sweepstakes/get-published-sweepstakes';
import getSweepstakesForm from '@/procedures/sweepstakes/get-sweepstakes-form';
import getSweepstakesStatus from '@/procedures/sweepstakes/get-sweepstakes-status';
import { SweepstakesForm } from '@/components/sweepstakes-editor/sweepstakes-form';
import { DerivedSweepstakeStatus } from '@giveaway/sweepstakes-model/sweepstakes';
import { ApplicationErrorCode } from '@giveaway/util-errors';
import { SweepstakeFormPage } from '../sweepstakes-form-page';
import { buildFormValues } from './form-harness';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  })
}));

vi.mock('@/procedures/sweepstakes/get-sweepstakes-form', () => ({
  default: vi.fn()
}));

vi.mock('@/procedures/sweepstakes/get-sweepstakes-status', () => ({
  default: vi.fn()
}));

vi.mock('@giveaway/integration-server/get-team-integrations', () => ({
  getTeamIntegrations: vi.fn()
}));

vi.mock('@/procedures/sweepstakes/get-published-sweepstakes', () => ({
  getPublishedSweepstakes: vi.fn()
}));

vi.mock('@/components/sweepstakes-editor/sweepstakes-form', () => ({
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
    vi.mocked(SweepstakesForm).mockClear();
    succeed();
  });

  it('loads the form, status, integrations and published count', async () => {
    await renderPage();
    expect(getSweepstakesForm).toHaveBeenCalledWith({ id: 'sweepstakes-1' });
    expect(getSweepstakesStatus).toHaveBeenCalledWith({ id: 'sweepstakes-1' });
    expect(getTeamIntegrations).toHaveBeenCalledWith({ slug: 'acme' });
    expect(getPublishedSweepstakes).toHaveBeenCalledWith({ slug: 'acme' });
  });

  describe('when everything loads', () => {
    it.each(['DRAFT', 'RUNNING', 'SCHEDULED', 'EXPIRED', 'ERROR'] as const)(
      'renders the editor for a %s sweepstakes',
      async (status) => {
        succeed(status);
        await renderPage();
        expect(screen.getByText('Sweepstakes form')).toBeInTheDocument();
      }
    );

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
