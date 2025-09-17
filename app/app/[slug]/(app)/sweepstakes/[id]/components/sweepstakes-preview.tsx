'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Smartphone, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSweepstakesDetailsContext } from './use-sweepstakes-details-context';
import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import { SweepstakesStatusComponent } from '@/components/sweepstakes-editor/sweepstakes-status';
import { noop } from 'lodash';
import {
  mockWinners,
  mockUserProfile,
  mockUserParticipation,
  mockParticipation
} from '@/components/sweepstakes-editor/data/mocks';
import { cn } from '@/lib/utils';
import { DeviceType } from '@/schemas/giveaway/schemas';
import { useIsMobile } from '@/components/hooks/use-mobile';

export const SweepstakesPreview: React.FC = () => {
  const { sweepstakes, liveUrl } = useSweepstakesDetailsContext();

  return (
    <div className="space-y-6">
      {sweepstakes && (
        <SweepstakesStatusComponent
          status={sweepstakes.status}
          startDate={sweepstakes.timing.startDate}
          endDate={sweepstakes.timing.endDate}
          timeZone={sweepstakes.timing.timeZone}
          sweepstakesUrl={liveUrl}
          onPickWinners={() => {
            console.log('Pick winners clicked');
          }}
          onAnnounceWinners={() => {
            console.log('Announce winners clicked');
          }}
          onGenerateQR={() => {
            console.log('Generate QR code clicked');
          }}
        />
      )}

      <ScreenPreview />
    </div>
  );
};

const ScreenPreview: React.FC = () => {
  const { sweepstakes, host } = useSweepstakesDetailsContext();

  const { isMobile } = useIsMobile();
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  useEffect(() => {
    console.log({ isMobile });
    if (isMobile) {
      setPreviewDevice('mobile');
    }
  }, [isMobile]);

  return (
    <div className="space-y-4 mt-4">
      {/* Preview Frame */}
      <Card className="p-0 overflow-hidden">
        <CardContent className="p-4 bg-giveaway space-y-4">
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
            <div className="rounded-lg overflow-hidden">
              {sweepstakes && host ? (
                <GiveawayParticipation
                  device={previewDevice}
                  isLoading={false}
                  sweepstakes={sweepstakes}
                  host={host}
                  participation={mockParticipation}
                  winners={mockWinners}
                  userProfile={mockUserProfile}
                  userParticipation={mockUserParticipation}
                  state={'active'}
                  onTaskComplete={noop}
                  onLogin={noop}
                  onCompleteProfile={noop}
                />
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
          </div>
        </CardContent>
      </Card>
    </div>
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
