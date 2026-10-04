import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsProvider } from '@giveaway/team-context/team-provider';
import {
  getPreviewParticipant,
  getPreviewRelationship
} from '@/components/sweepstakes-editor/sweepstakes-editor-preview';
import {
  buildGiveawayPrize,
  buildHost,
  buildParticipant,
  buildParticipation,
  buildPrize,
  buildPrizeDraw,
  buildSweepstakes,
  buildTeam,
  withStableIds
} from '@/components/sweepstakes/__tests__/fixtures';
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

  it('matches the snapshot', () => {
    const { container } = renderPreview();
    expect(withStableIds(container)).toMatchSnapshot();
  });
});
