'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@giveaway/ui-primitives/card';
import { Separator } from '@giveaway/ui-primitives/separator';
import { ClockIcon, CalendarIcon, FileCheck } from 'lucide-react';
import { useGiveawayParticipation } from '@giveaway/sweepstakes-participation-core/giveaway-participation-context';
import { TermsModal } from '@giveaway/sweepstakes-participation-core/terms-modal';
import { DeviceType, GiveawayState } from '@giveaway/sweepstakes-model/schemas';
import { cn } from '@giveaway/ui-utils/utils';
import { date } from '@giveaway/util-time/date';
import { getSweepstakesTimingDescription } from '@giveaway/sweepstakes-model/sweepstakes';
import { MinimalTipTapPreview } from '@giveaway/ui-rich-text/minimal-tiptap-preview';
import { PLATFORM_ICONS } from '@giveaway/team-settings-socials/social-links/social-link-icon';
import {
  parseSocialLinks,
  type SocialLink
} from '@giveaway/team-model/social-links';

const SWEEPSTAKE_PARTICIPATION_CARD_THEME: Record<GiveawayState, string> = {
  'not-logged-in': '',
  pending: '',
  'profile-incomplete': 'bg-muted',
  'not-eligible': '',
  'winners-announced': '',
  'no-prize-allocation': '',
  active: '',
  canceled: '',
  closed: '',
  error: '',
  'winners-pending': ''
};

export const GiveawayParticipationCard: React.PC<{
  device?: DeviceType;
}> = ({ children, device }) => {
  const { state } = useGiveawayParticipation();
  const stateTheme = SWEEPSTAKE_PARTICIPATION_CARD_THEME[state];

  return (
    <Card className="relative gap-0 overflow-hidden w-full space-y-2 sm:space-y-4 px-0 pb-2 pt-4">
      <TimeRemainingSection device={device} />
      <BannerSection />
      <TitleSection />
      <DescriptionSection />
      <Separator className="mb-0" />
      <CardContent className={cn('p-3 m-0', stateTheme)}>
        {children}
      </CardContent>
      <div className="space-y-2">
        <Separator />
        <FooterSection />
      </div>
    </Card>
  );
};

const subscribeToNothing = () => () => {};

// False on the server and while React hydrates, true after.
const useHydrated = () =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );

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
  const hydrated = useHydrated();

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
          {/* The server formats the dates in its own time zone, which can
              give another day than the browser. The new key replaces the
              server text with the dates of the browser after hydration. */}
          <div
            key={hydrated ? 'browser' : 'server'}
            className="text-xs text-muted-foreground font-semibold"
            suppressHydrationWarning
          >
            {`${startDate} - ${endDate}`}
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
          <div
            className="text-xs text-muted-foreground font-semibold"
            suppressHydrationWarning
          >
            {timing}
          </div>
        </div>
        <Separator
          orientation="vertical"
          className={cn('data-[orientation=vertical]:h-4 bg-muted-foreground')}
        />
        <div className="flex gap-1">
          <FileCheck className="h-4 w-4 text-muted-foreground" />
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

  const socialLinks: SocialLink[] = parseSocialLinks(host.links);

  if (!sweepstakes.design.displayName) return null;

  return (
    <CardContent className="space-y-0.5">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
        {sweepstakes.setup.name}
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-1 flex-wrap">
        <span>
          by{' '}
          <Link
            href={`/browse?hosts=${host.slug}`}
            className="font-semibold underline hover:text-primary hover:underline transition-colors"
          >
            {host.name}
          </Link>
        </span>
        {socialLinks.length > 0 && (
          <span className="flex items-center gap-1">
            {socialLinks.map((link, index) => {
              const Icon = PLATFORM_ICONS[link.platform].icon;
              const label = PLATFORM_ICONS[link.platform].label;
              return (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-4 h-4 rounded bg-white dark:bg-input/30 border border-border flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <Icon className="w-2.5 h-2.5 text-foreground" />
                </a>
              );
            })}
          </span>
        )}
      </p>
    </CardContent>
  );
};

const BannerSection = () => {
  const { sweepstakes } = useGiveawayParticipation();
  const { aspectRatio } = sweepstakes.design;

  return (
    <CardContent className="relative">
      {sweepstakes.setup.banner && (
        <div className="relative">
          <div
            className={cn(
              'overflow-hidden rounded-lg flex w-full',
              aspectRatio === 'VIDEO' ? 'aspect-video' : ''
            )}
          >
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
      <MinimalTipTapPreview content={sweepstakes.setup.description} />
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
