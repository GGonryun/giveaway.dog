'use client';

import { cn } from '@/lib/utils';
import {
  ParticipantSweepstakeSchema,
  DeviceType
} from '@/schemas/giveaway/schemas';
import { noop } from 'lodash';
import { Eye, Smartphone, Monitor } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useIsMobile } from '../hooks/use-mobile';
import { QRCodeModal } from '../patterns/qr-code-modal';
import {
  mockParticipation,
  mockUserProfile,
  mockUserParticipation,
  mockAgeVerification
} from '../sweepstakes-editor/data/mocks';
import { SweepstakesStatusComponent } from '../sweepstakes-editor/sweepstakes-status';
import GiveawayParticipation from '../sweepstakes/giveaway-participation';
import { useBrowseSweepstakesPage } from '../sweepstakes/use-browse-sweepstakes-page';
import { useSweepstakesDetailsPage } from '../sweepstakes/use-sweepstakes-details-page';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { computeState } from '@/lib/sweepstakes';
import { toBackgroundStyle } from '@/schemas/color';
import { TeamFeatureFlagKeySchema } from '@/schemas/feature-flags';
import { useProcedure } from '@/lib/mrpc/hook';
import completeSweepstakes from '@/procedures/sweepstakes/complete-sweepstakes';
import { useRouter } from 'next/navigation';
import { useTeams } from '../context/team-provider';
import { PickerDrawResult } from '@prisma/client';

export const SweepstakesPreview: React.FC<
  ParticipantSweepstakeSchema & { teamFeatureFlags: TeamFeatureFlagKeySchema[] }
> = (props) => {
  const { sweepstakes, prizes, teamFeatureFlags = [] } = props;
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
      prize.draws.filter((d) => d.result === PickerDrawResult.WINNER).length,
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
          teamFeatureFlags={teamFeatureFlags}
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

  useEffect(() => {
    if (isMobile) {
      setPreviewDevice('mobile');
    }
  }, [isMobile]);

  const state = computeState({
    sweepstakes,
    prizes: winners,
    userProfile: mockUserProfile,
    ageVerification: mockAgeVerification
  });

  const bg = useMemo(
    () => toBackgroundStyle(sweepstakes.design.background),
    [sweepstakes.design.background]
  );

  return (
    <Card
      className="p-0"
      style={{
        background: bg
      }}
    >
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-center space-x-2">
          {!isMobile && (
            <DeviceSelector
              previewDevice={previewDevice}
              setPreviewDevice={setPreviewDevice}
            />
          )}
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
                userProfile={mockUserProfile}
                userParticipation={mockUserParticipation}
                state={state}
                onTaskComplete={async () => Promise.resolve()}
                onLogin={noop}
                onCompleteProfile={noop}
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
