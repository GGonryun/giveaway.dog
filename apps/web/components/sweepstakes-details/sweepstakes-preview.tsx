'use client';

import { cn } from '@giveaway/ui-utils/utils';
import {
  ParticipantSweepstakeSchema,
  DeviceType,
  GiveawayState,
  getStateDisplayLabel
} from '@/schemas/giveaway/schemas';
import { Eye, Smartphone, Monitor } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useIsMobile } from '@giveaway/ui-hooks/use-mobile';
import { QRCodeModal } from '../patterns/qr-code-modal';
import {
  mockParticipation,
  onFakeLogin,
  onFakeTaskComplete,
  onFakeCompleteProfile,
  onFakeFormSubmit,
  onFakeCreateReferral,
  mockUserReferral,
  onFakeTaskUpdate,
  onFakeAllocate
} from '../sweepstakes-editor/data/mocks';
import { SweepstakesStatusComponent } from '../sweepstakes-editor/sweepstakes-status';
import GiveawayParticipation from '../sweepstakes/giveaway-participation';
import { useBrowseSweepstakesPage } from '../sweepstakes/use-browse-sweepstakes-page';
import { useSweepstakesDetailsPage } from '../sweepstakes/use-sweepstakes-details-page';
import { Card, CardContent } from '@giveaway/ui-primitives/card';
import { Button } from '@giveaway/ui-primitives/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@giveaway/ui-primitives/select';
import { toBackgroundStyle } from '@/schemas/color';
import { useProcedure } from '@giveaway/rpc-client/hook';
import completeSweepstakes from '@/procedures/sweepstakes/complete-sweepstakes';
import { useRouter } from 'next/navigation';
import { useTeams } from '../context/team-provider';
import { PrizeDrawResult } from '@prisma/client';
import {
  getPreviewParticipant,
  getPreviewRelationship
} from '../sweepstakes-editor/sweepstakes-editor-preview';

export const SweepstakesPreview: React.FC<ParticipantSweepstakeSchema> = (
  props
) => {
  const { sweepstakes, prizes } = props;
  const browse = useBrowseSweepstakesPage();
  const detailsPage = useSweepstakesDetailsPage();
  const router = useRouter();
  const { activeTeam } = useTeams();
  const liveUrl = browse.url({
    sweepstakesId: sweepstakes.id,
    slug: sweepstakes.visibility.slug
  });
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const { run: runCompleteSweepstakes, isLoading: isCompleting } = useProcedure(
    {
      action: completeSweepstakes,
      onSuccess: () => {
        router.push(`/app/${activeTeam.slug}`);
      }
    }
  );

  const totalPrizeSlots = sweepstakes.prizes.reduce(
    (sum, prize) => sum + prize.quota,
    0
  );
  const selectedWinners = prizes.reduce(
    (sum, prize) =>
      sum +
      prize.draws.filter((d) => d.result === PrizeDrawResult.WINNER).length,
    0
  );
  const hasAllWinnersSelected = selectedWinners >= totalPrizeSlots;

  const handleCompleteSweepstakes = () => {
    runCompleteSweepstakes({
      sweepstakesId: sweepstakes.id,
      slug: activeTeam.slug
    });
  };

  return (
    <>
      {sweepstakes && (
        <SweepstakesStatusComponent
          sweepstakesId={sweepstakes.id}
          status={sweepstakes.status}
          startDate={sweepstakes.timing.startDate}
          endDate={sweepstakes.timing.endDate}
          timeZone={sweepstakes.timing.timeZone}
          visibility={sweepstakes.visibility.visibility}
          sweepstakesUrl={liveUrl}
          hasAllWinnersSelected={hasAllWinnersSelected}
          onPickWinners={() => {
            detailsPage.setTab(sweepstakes.id, 'winners');
          }}
          onGenerateQR={() => {
            setIsQRModalOpen(true);
          }}
          onCompleteSweepstakes={handleCompleteSweepstakes}
          isCompleting={isCompleting}
        />
      )}

      <ScreenPreview {...props} />

      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        value={liveUrl}
        title="Share Sweepstakes QR Code"
        size={256}
      />
    </>
  );
};

const ScreenPreview: React.FC<ParticipantSweepstakeSchema> = ({
  sweepstakes,
  host,
  prizes: winners
}) => {
  const { isMobile } = useIsMobile();
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');
  const [previewState, setPreviewState] = useState<GiveawayState>('active');

  useEffect(() => {
    if (isMobile) {
      setPreviewDevice('mobile');
    }
  }, [isMobile]);

  const bg = useMemo(
    () => toBackgroundStyle(sweepstakes.design.background),
    [sweepstakes.design.background]
  );

  const participant = useMemo(() => {
    return getPreviewParticipant(sweepstakes, winners, previewState);
  }, [previewState, sweepstakes, winners]);

  const userHostRelationship = useMemo(() => {
    return getPreviewRelationship(previewState);
  }, [previewState]);

  return (
    <Card
      className="p-0"
      style={{
        background: bg
      }}
    >
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {!isMobile && (
            <DeviceSelector
              previewDevice={previewDevice}
              setPreviewDevice={setPreviewDevice}
            />
          )}
          <StateSelector
            previewState={previewState}
            setPreviewState={setPreviewState}
          />
        </div>
        <div
          className={cn(
            `transition-all duration-300 mx-auto`,
            previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
          )}
        >
          {sweepstakes && host ? (
            <>
              <GiveawayParticipation
                hideBackground
                device={previewDevice}
                sweepstakes={sweepstakes}
                host={host}
                participation={mockParticipation}
                prizes={winners}
                participant={participant}
                relationship={userHostRelationship}
                state={previewState}
                referral={mockUserReferral}
                isPreview={true}
                onAllocate={onFakeAllocate}
                onCreateReferral={onFakeCreateReferral}
                onTaskComplete={onFakeTaskComplete}
                onTaskUpdate={onFakeTaskUpdate}
                onLogin={onFakeLogin}
                onCompleteProfile={onFakeCompleteProfile}
                onFormSubmit={onFakeFormSubmit}
                verifyEmail={false}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Eye className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-medium">No Preview Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Landing page URL not configured
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

type DeviceSelectorProps = {
  previewDevice: DeviceType;
  setPreviewDevice: React.Dispatch<React.SetStateAction<DeviceType>>;
};

const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  previewDevice,
  setPreviewDevice
}) => {
  return (
    <div className="flex items-center rounded-lg ">
      <Button
        variant={previewDevice === 'mobile' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setPreviewDevice('mobile')}
        className="rounded-r-none border"
      >
        <Smartphone className="h-4 w-4" /> Mobile
      </Button>
      <Button
        variant={previewDevice === 'desktop' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setPreviewDevice('desktop')}
        className="rounded-l-none border-x-0 border"
      >
        <Monitor className="h-4 w-4" /> Desktop
      </Button>
    </div>
  );
};

type StateSelectorProps = {
  previewState: GiveawayState;
  setPreviewState: React.Dispatch<React.SetStateAction<GiveawayState>>;
};

const AVAILABLE_PREVIEW_STATES: GiveawayState[] = [
  'active',
  'not-logged-in',
  'profile-incomplete',
  'not-eligible',
  'winners-announced',
  'winners-pending',
  'pending',
  'closed',
  'canceled',
  'error'
];

const StateSelector: React.FC<StateSelectorProps> = ({
  previewState,
  setPreviewState
}) => {
  return (
    <Select
      value={previewState}
      onValueChange={(value) => setPreviewState(value as GiveawayState)}
    >
      <SelectTrigger className="w-45 h-8">
        <SelectValue placeholder="Select state" />
      </SelectTrigger>
      <SelectContent>
        {AVAILABLE_PREVIEW_STATES.map((state) => (
          <SelectItem key={state} value={state}>
            {getStateDisplayLabel(state)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
