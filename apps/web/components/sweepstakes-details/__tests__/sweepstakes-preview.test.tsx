import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsProvider } from '@giveaway/team-context/team-provider';
import { QRCodeModal } from '@giveaway/ui-qr/qr-code-modal';
import {
  mockParticipation,
  mockUserReferral
} from '@/components/sweepstakes-editor/data/mocks';
import {
  getPreviewParticipant,
  getPreviewRelationship
} from '@/components/sweepstakes-editor/sweepstakes-editor-preview';
import { SweepstakesStatusComponent } from '@/components/sweepstakes-editor/sweepstakes-status';
import GiveawayParticipation from '@/components/sweepstakes/giveaway-participation';
import {
  buildGiveawayPrize,
  buildHost,
  buildParticipant,
  buildParticipation,
  buildPrize,
  buildPrizeDraw,
  buildSweepstakes,
  buildTeam
} from '@/components/sweepstakes/__tests__/fixtures';
import completeSweepstakes from '@/procedures/sweepstakes/complete-sweepstakes';
import { DEFAULT_DESIGN_DATA } from '@giveaway/sweepstakes-model/defaults';
import type { GiveawayPrizeSchema } from '@giveaway/sweepstakes-model/schemas';
import { SweepstakesPreview } from '../sweepstakes-preview';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({ useRouter: () => navigation.router }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/procedures/sweepstakes/complete-sweepstakes', () => ({
  default: vi.fn()
}));

vi.mock('@/components/sweepstakes-editor/sweepstakes-status', () => ({
  SweepstakesStatusComponent: vi.fn(() => <div>status panel</div>)
}));

vi.mock('@/components/sweepstakes/giveaway-participation', () => ({
  default: vi.fn(() => <div>giveaway preview</div>)
}));

vi.mock('@giveaway/ui-qr/qr-code-modal', () => ({
  QRCodeModal: vi.fn(({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>qr code modal</div> : null
  )
}));

const previewParticipant = buildParticipant({ id: 'preview-participant' });

vi.mock('@/components/sweepstakes-editor/sweepstakes-editor-preview', () => ({
  getPreviewParticipant: vi.fn(),
  getPreviewRelationship: vi.fn()
}));

const sweepstakes = buildSweepstakes({
  status: 'EXPIRED',
  prizes: [
    buildPrize({ id: 'prize-1', quota: 1 }),
    buildPrize({ id: 'prize-2', name: 'Gift Card', quota: 2 })
  ]
});

const oneWinner: GiveawayPrizeSchema[] = [
  buildGiveawayPrize({
    draws: [
      buildPrizeDraw({ id: 'draw-1' }),
      buildPrizeDraw({ id: 'draw-2', result: 'DISQUALIFIED' })
    ]
  })
];

const team = buildTeam();

type PreviewProps = ComponentProps<typeof SweepstakesPreview>;

const renderPreview = (props: Partial<PreviewProps> = {}) =>
  render(
    <TeamsProvider value={{ activeTeam: team, teams: [team] }}>
      <SweepstakesPreview
        sweepstakes={sweepstakes}
        host={buildHost()}
        prizes={oneWinner}
        participation={buildParticipation()}
        {...props}
      />
    </TeamsProvider>
  );

const statusProps = () => {
  const call = vi.mocked(SweepstakesStatusComponent).mock.lastCall;
  if (!call) throw new Error('status panel was not rendered');
  return call[0];
};

const previewProps = () => {
  const call = vi.mocked(GiveawayParticipation).mock.lastCall;
  if (!call) throw new Error('giveaway preview was not rendered');
  return call[0];
};

describe('SweepstakesPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPreviewParticipant).mockReturnValue(previewParticipant);
    vi.mocked(getPreviewRelationship).mockReturnValue({ loyalty: 2 });
    window.innerWidth = 1024;
  });

  afterEach(() => {
    window.innerWidth = 1024;
  });

  describe('status panel', () => {
    it('describes the sweepstakes with its public url', () => {
      renderPreview();
      expect(statusProps()).toMatchObject({
        sweepstakesId: 'sweep-1',
        status: 'EXPIRED',
        startDate: sweepstakes.timing.startDate,
        endDate: sweepstakes.timing.endDate,
        timeZone: 'UTC',
        visibility: 'PUBLIC',
        sweepstakesUrl: `${window.location.origin}/browse/summer-giveaway`,
        hasAllWinnersSelected: false,
        isCompleting: false
      });
    });

    it('knows when every prize slot has a winner', () => {
      renderPreview({
        sweepstakes: buildSweepstakes({ prizes: [buildPrize({ quota: 1 })] })
      });
      expect(statusProps().hasAllWinnersSelected).toBe(true);
    });

    it('opens the winners tab to pick winners', () => {
      renderPreview();
      statusProps().onPickWinners?.();
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/acme/sweepstakes/sweep-1/winners'
      );
    });

    it('opens and closes the QR code of the public url', () => {
      renderPreview();
      expect(screen.queryByText('qr code modal')).not.toBeInTheDocument();

      act(() => statusProps().onGenerateQR?.());

      expect(screen.getByText('qr code modal')).toBeInTheDocument();
      const qrProps = vi.mocked(QRCodeModal).mock.lastCall?.[0];
      expect(qrProps).toMatchObject({
        isOpen: true,
        value: `${window.location.origin}/browse/summer-giveaway`,
        title: 'Share Sweepstakes QR Code',
        size: 256
      });

      act(() => qrProps?.onClose());
      expect(screen.queryByText('qr code modal')).not.toBeInTheDocument();
    });

    it('completes the sweepstakes and returns to the dashboard', async () => {
      vi.mocked(completeSweepstakes).mockResolvedValue({
        ok: true,
        data: { success: true }
      });
      renderPreview();

      act(() => statusProps().onCompleteSweepstakes?.());

      expect(completeSweepstakes).toHaveBeenCalledWith({
        sweepstakesId: 'sweep-1',
        slug: 'acme'
      });
      await waitFor(() =>
        expect(navigation.router.push).toHaveBeenCalledWith('/app/acme')
      );
    });
  });

  describe('live preview', () => {
    it('renders the participation in preview mode with mock data', () => {
      const host = buildHost();
      renderPreview({ host });
      expect(previewProps()).toMatchObject({
        hideBackground: true,
        device: 'desktop',
        sweepstakes,
        host,
        prizes: oneWinner,
        participation: mockParticipation,
        participant: previewParticipant,
        relationship: { loyalty: 2 },
        state: 'active',
        referral: mockUserReferral,
        isPreview: true,
        verifyEmail: false
      });
      expect(getPreviewParticipant).toHaveBeenCalledWith(
        sweepstakes,
        oneWinner,
        'active'
      );
    });

    it('paints the design background behind the preview', () => {
      const { container } = renderPreview({
        sweepstakes: buildSweepstakes({
          design: {
            ...DEFAULT_DESIGN_DATA,
            background: { type: 'color', color: '#123456' }
          }
        })
      });
      expect(container.querySelector('[data-slot="card"]')).toHaveStyle({
        background: '#123456'
      });
    });

    it('switches between the desktop and mobile previews', async () => {
      const user = userEvent.setup();
      renderPreview();
      const frame = screen.getByText('giveaway preview').parentElement;
      expect(frame).toHaveClass('max-w-2xl');

      await user.click(screen.getByRole('button', { name: 'Mobile' }));
      expect(previewProps().device).toBe('mobile');
      expect(frame).toHaveClass('max-w-sm');

      await user.click(screen.getByRole('button', { name: 'Desktop' }));
      expect(previewProps().device).toBe('desktop');
    });

    it('previews the chosen participation state', async () => {
      const user = userEvent.setup();
      renderPreview();

      await user.click(screen.getByRole('combobox'));
      expect(
        screen.getAllByRole('option').map((option) => option.textContent)
      ).toEqual([
        'Active State',
        'Not Logged In',
        'Profile Incomplete',
        'Not Eligible',
        'Winners Announced',
        'Winners Pending',
        'Pending',
        'Closed',
        'Canceled',
        'Error'
      ]);
      await user.click(
        screen.getByRole('option', { name: 'Winners Announced' })
      );

      expect(previewProps().state).toBe('winners-announced');
      expect(getPreviewParticipant).toHaveBeenLastCalledWith(
        sweepstakes,
        oneWinner,
        'winners-announced'
      );
      expect(getPreviewRelationship).toHaveBeenLastCalledWith(
        'winners-announced'
      );
    });

    it('always previews the mobile layout on small screens', () => {
      window.innerWidth = 500;
      renderPreview();
      expect(
        screen.queryByRole('button', { name: 'Mobile' })
      ).not.toBeInTheDocument();
      expect(previewProps().device).toBe('mobile');
    });
  });
});
