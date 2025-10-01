'use client';

import { cn } from '@/lib/utils';
import {
  ParticipantSweepstakeSchema,
  DeviceType
} from '@/schemas/giveaway/schemas';
import { noop } from 'lodash';
import { Eye, Smartphone, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useIsMobile } from '../hooks/use-mobile';
import { useUrl } from '../hooks/use-url';
import { QRCodeModal } from '../patterns/qr-code-modal';
import {
  mockParticipation,
  mockWinners,
  mockUserProfile,
  mockUserParticipation
} from '../sweepstakes-editor/data/mocks';
import { SweepstakesStatusComponent } from '../sweepstakes-editor/sweepstakes-status';
import GiveawayParticipation from '../sweepstakes/giveaway-participation';
import { useBrowseSweepstakesPage } from '../sweepstakes/use-browse-sweepstakes-page';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

export const SweepstakesPreview: React.FC<ParticipantSweepstakeSchema> = (
  props
) => {
  const { sweepstakes } = props;
  const browse = useBrowseSweepstakesPage();
  const liveUrl = browse.url({ sweepstakesId: sweepstakes.id });
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

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
            alert('Pick winners clicked');
          }}
          onAnnounceWinners={() => {
            alert('Announce winners clicked');
          }}
          onGenerateQR={() => {
            setIsQRModalOpen(true);
          }}
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
    </div>
  );
};

const ScreenPreview: React.FC<ParticipantSweepstakeSchema> = ({
  sweepstakes,
  host
}) => {
  const { isMobile } = useIsMobile();
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

  useEffect(() => {
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
