'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  ClockIcon,
  CalendarIcon,
  Gift,
  FileText,
  BuildingIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGiveawayParticipation } from './giveaway-participation-context';
import { format, formatDistanceToNow, isBefore, isAfter } from 'date-fns';
import { HostInfoCard } from './participation-header/host-info-card';
import { TermsModal } from './terms-modal';
import { Typography } from '../ui/typography';

export const GiveawayParticipationHeader: React.PC = ({ children }) => {
  return (
    <Card className="relative p-0 m-0 gap-0 overflow-hidden w-full space-y-2 pt-6 pb-2">
      <TimeRemainingSection />
      <TitleSection />
      <BannerSection />
      <HostSection />
      <PrizesSection />
      <DescriptionSection />
      <Separator className="my-2" />
      <CardContent>{children}</CardContent>
      <Separator />
      <FooterSection />
    </Card>
  );
};

const TimeRemainingSection = () => {
  const { sweepstakes, participation } = useGiveawayParticipation();
  const now = new Date();
  const startDate = format(sweepstakes.timing.startDate, 'MMM d, yyyy');
  const endDate = format(sweepstakes.timing.endDate, 'MMM d, yyyy');
  const hasEnded = isAfter(now, endDate);
  const isUpcoming = isBefore(now, startDate);

  return (
    <CardContent>
      <div className="flex flex-row gap-x-4 gap-y-2">
        <div className="hidden sm:flex items-center gap-1">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <div className="text-xs text-muted-foreground font-semibold">
            {startDate} - {endDate}
          </div>
        </div>
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-4 bg-muted-foreground hidden sm:block"
        />
        <div className="flex gap-1">
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
          <div className="text-xs text-muted-foreground font-semibold">
            {isUpcoming
              ? `Starts in ${formatDistanceToNow(startDate)}`
              : hasEnded
                ? 'Giveaway Ended'
                : `${formatDistanceToNow(endDate)} left`}
          </div>
        </div>
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-4 bg-muted-foreground hidden sm:block"
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
  const { sweepstakes } = useGiveawayParticipation();

  return (
    <CardContent>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
        {sweepstakes.setup.name}
      </h1>
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

const HostSection = () => {
  const { host } = useGiveawayParticipation();
  return (
    <CardContent className="mt-2">
      <HostInfoCard host={host} />
    </CardContent>
  );
};

const DescriptionSection = () => {
  const { sweepstakes } = useGiveawayParticipation();

  if (!sweepstakes.setup.description) return null;

  return (
    <CardContent>
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Description</h3>
        </div>
        <p className="text-sm sm:text-base leading-relaxed">
          {sweepstakes.setup.description}
        </p>
      </div>
    </CardContent>
  );
};

const PrizesSection = () => {
  const { sweepstakes } = useGiveawayParticipation();
  const hasPrizes = sweepstakes.prizes && sweepstakes.prizes.length > 0;

  if (!hasPrizes) return null;

  return (
    <CardContent className="mt-2">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Prizes</h3>
        </div>
        <ul className="space-y-2">
          {sweepstakes.prizes.map((prize, index) => (
            <li key={index} className="flex items-center justify-between">
              <span className="text-sm sm:text-base">• {prize.name}</span>
              <Badge variant="secondary" className="ml-2">
                {prize.quota} {prize.quota === 1 ? 'winner' : 'winners'}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </CardContent>
  );
};

const FooterSection = () => {
  const { host } = useGiveawayParticipation();

  return (
    <CardContent>
      <div className="flex flex-row items-center justify-center gap-x-4 gap-y-2">
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
      </div>
    </CardContent>
  );
};
