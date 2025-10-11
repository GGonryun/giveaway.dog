'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users, ClockIcon, CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGiveawayParticipation } from './giveaway-participation-context';
import { TermsModal } from './terms-modal';
import { DeviceType } from '@/schemas/giveaway/schemas';
import { cn } from '@/lib/utils';
import { date } from '@/lib/date';
import { getSweepstakesTimingDescription } from './status-badge';
import { richTextPreviewStyles } from '@/lib/rich-text-styles';

export const GiveawayParticipationCard: React.PC<{
  device?: DeviceType;
}> = ({ children, device }) => {
  return (
    <Card className="relative gap-0 overflow-hidden w-full space-y-2 sm:space-y-4 px-0 pb-2 pt-4">
      <TimeRemainingSection device={device} />
      <BannerSection />
      <TitleSection />
      <PrizesSection />
      <DescriptionSection />
      <Separator className="mb-0" />
      <CardContent className="py-3 m-0">{children}</CardContent>
      <Separator />
      <FooterSection />
    </Card>
  );
};

const TimeRemainingSection: React.FC<{ device?: DeviceType }> = ({
  device
}) => {
  const { sweepstakes, participation } = useGiveawayParticipation();
  const timing = getSweepstakesTimingDescription({
    status: sweepstakes.status,
    startDate: sweepstakes.timing.startDate,
    endDate: sweepstakes.timing.endDate
  });
  const startDate = date.format(sweepstakes.timing.startDate);
  const endDate = date.format(sweepstakes.timing.endDate);

  return (
    <CardContent>
      <div className="flex flex-row gap-x-4 gap-y-2">
        <div
          className={cn(
            'hidden sm:flex items-center gap-1',
            device === 'mobile' && 'hidden sm:hidden'
          )}
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <div className="text-xs text-muted-foreground font-semibold">
            {startDate} - {endDate}
          </div>
        </div>
        <Separator
          orientation="vertical"
          className={cn(
            'data-[orientation=vertical]:h-4 bg-muted-foreground hidden sm:block',
            device === 'mobile' && 'hidden sm:hidden'
          )}
        />
        <div className="flex gap-1">
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
          <div className="text-xs text-muted-foreground font-semibold">
            {timing}
          </div>
        </div>
        <Separator
          orientation="vertical"
          className={cn('data-[orientation=vertical]:h-4 bg-muted-foreground')}
        />
        <div className="flex gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-semibold">
            {participation.totalEntries} total entries
          </span>
        </div>
      </div>
    </CardContent>
  );
};

const TitleSection = () => {
  const { sweepstakes, host } = useGiveawayParticipation();

  if (!sweepstakes.design.displayName) return null;

  return (
    <CardContent className="space-y-0.5">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
        {sweepstakes.setup.name}
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground">
        by <span className="font-semibold">{host.name}</span>
      </p>
    </CardContent>
  );
};

const BannerSection = () => {
  const { sweepstakes } = useGiveawayParticipation();

  return (
    <CardContent className="relative">
      {sweepstakes.setup.banner && (
        <div className="relative">
          <div className="overflow-hidden rounded-lg aspect-video flex w-full">
            <img
              src={sweepstakes.setup.banner}
              alt={sweepstakes.setup.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </CardContent>
  );
};

const DescriptionSection = () => {
  const { sweepstakes } = useGiveawayParticipation();

  if (!sweepstakes.setup.description) return null;
  if (!sweepstakes.design.displayDescription) return null;

  return (
    <CardContent>
      <div
        className={richTextPreviewStyles}
        dangerouslySetInnerHTML={{ __html: sweepstakes.setup.description }}
      />
    </CardContent>
  );
};

const PrizesSection = () => {
  const { sweepstakes } = useGiveawayParticipation();
  const hasPrizes = sweepstakes.prizes && sweepstakes.prizes.length > 0;

  if (!hasPrizes) return null;

  return (
    <CardContent>
      <h3 className="text-lg font-semibold">Prizes</h3>
      <ul className="space-y-0.5">
        {sweepstakes.prizes.map((prize, index) => (
          <li key={index} className="flex items-center justify-between">
            <span className="text-sm sm:text-base">• {prize.name}</span>
            <Badge variant="secondary" className="ml-2">
              {prize.quota} {prize.quota === 1 ? 'winner' : 'winners'}
            </Badge>
          </li>
        ))}
      </ul>
    </CardContent>
  );
};

const FooterSection = () => {
  const { host } = useGiveawayParticipation();

  return (
    <CardContent className="flex flex-row items-center justify-center gap-x-4 gap-y-2">
      <TermsModal>
        <button className="text-xs cursor-pointer underline hover:text-primary transition-colors">
          Terms & Conditions
        </button>
      </TermsModal>
      <Separator
        orientation="vertical"
        className="data-[orientation=vertical]:h-4 bg-muted-foreground"
      />
      <div className="text-xs">© {host.name}</div>
    </CardContent>
  );
};
