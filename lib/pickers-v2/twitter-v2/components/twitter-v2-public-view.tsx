'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle2, Calendar, Filter, UserCheck } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { TwitterV2PickerSchema } from '../schemas/details';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';
import { TwitterV2ParticipantsSection } from './twitter-v2-participants-section';
import { TwitterV2DrawHistorySection } from './twitter-v2-draw-history-section';
import { DisqualificationReasonModal } from './twitter-v2-disqualification-reason-modal';
import { TwitterScrapeProgressMonitor } from './twitter-scrape-progress-monitor';

interface TwitterV2PublicViewProps {
  picker: TwitterV2PickerSchema;
}

export const TwitterV2PublicView: React.FC<TwitterV2PublicViewProps> = ({
  picker
}) => {
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [reasonModalData, setReasonModalData] = useState<{
    winnerName: string;
    reason: string;
  } | null>(null);

  const isComplete = picker.status === 'COMPLETE';
  const isScheduledOrProcessing =
    picker.status === 'SCHEDULED' ||
    picker.status === 'PROCESSING' ||
    picker.status === 'CREATED';

  const winners = picker.draws.filter((d) => !d.disqualified);
  const eligibleUsers = picker.users.filter((u) => !u.ineligible);

  const hasRequirements =
    picker.minPostCount !== null ||
    picker.minFollowersCount !== null ||
    picker.minFollowingCount !== null ||
    picker.minAccountAgeDays !== null ||
    picker.requireProfileImage ||
    picker.requireBannerImage ||
    picker.requireLocation ||
    picker.requireBio;

  const handleShowReason = (winnerName: string, reason: string) => {
    setReasonModalData({ winnerName, reason });
    setReasonModalOpen(true);
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="text-center space-y-2">
        <MarketingPageHeader
          title={isComplete ? 'Draw Verification' : 'Upcoming Draw'}
          description={
            isComplete
              ? 'Transparent and verifiable random winner selection'
              : 'This draw is scheduled and will be processed soon'
          }
        />
      </div>

      {isScheduledOrProcessing && picker.runId && (
        <TwitterScrapeProgressMonitor
          pickerId={picker.id}
          runId={picker.runId}
          status={picker.status}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <SocialXIcon className="h-5 w-5" />X Picker Results
            </CardTitle>
            {isComplete ? (
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-yellow-600 border-yellow-600"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold">
                {isComplete ? picker.users.length : '-'}
              </div>
              <div className="text-sm text-muted-foreground">Participants</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold">
                {isComplete ? eligibleUsers.length : '-'}
              </div>
              <div className="text-sm text-muted-foreground">Eligible</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold">
                {isComplete ? winners.length : '-'}
              </div>
              <div className="text-sm text-muted-foreground">Winners</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {isComplete ? (
                  <>
                    Completed{' '}
                    {formatDistance(picker.updatedAt, new Date(), {
                      addSuffix: true
                    })}
                  </>
                ) : picker.runAt ? (
                  <>
                    Scheduled for{' '}
                    {formatDistance(picker.runAt, new Date(), {
                      addSuffix: true
                    })}
                  </>
                ) : (
                  'Processing'
                )}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{picker.winners} winner slots</span>
            </div>
          </div>

          {hasRequirements && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                Draw Requirements
              </div>
              <div className="flex flex-wrap gap-2">
                {picker.minPostCount !== null && (
                  <Badge variant="secondary">
                    Min {picker.minPostCount} posts
                  </Badge>
                )}
                {picker.minFollowersCount !== null && (
                  <Badge variant="secondary">
                    Min {picker.minFollowersCount} followers
                  </Badge>
                )}
                {picker.minFollowingCount !== null && (
                  <Badge variant="secondary">
                    Min {picker.minFollowingCount} following
                  </Badge>
                )}
                {picker.minAccountAgeDays !== null && (
                  <Badge variant="secondary">
                    Account {picker.minAccountAgeDays}+ days old
                  </Badge>
                )}
              </div>
              {(picker.requireProfileImage ||
                picker.requireBannerImage ||
                picker.requireLocation ||
                picker.requireBio) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <UserCheck className="h-4 w-4" />
                    Profile Requirements
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {picker.requireProfileImage && (
                      <Badge variant="outline">Profile Image</Badge>
                    )}
                    {picker.requireBannerImage && (
                      <Badge variant="outline">Banner Image</Badge>
                    )}
                    {picker.requireLocation && (
                      <Badge variant="outline">Location</Badge>
                    )}
                    {picker.requireBio && <Badge variant="outline">Bio</Badge>}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <TwitterV2DrawHistorySection
        draws={picker.draws}
        users={picker.users}
        onViewReason={handleShowReason}
        isComplete={isComplete}
      />

      <TwitterV2ParticipantsSection participants={picker.users} />

      <div className="text-center text-muted-foreground">
        <p>
          Powered by{' '}
          <Link href="/" className="font-semibold text-primary underline">
            Giveaway.dog
          </Link>
        </p>
        <p className="text-sm mt-1">Fair, transparent, and verifiable draws</p>
      </div>

      <DisqualificationReasonModal
        open={reasonModalOpen}
        onOpenChange={setReasonModalOpen}
        winnerName={reasonModalData?.winnerName}
        reason={reasonModalData?.reason}
      />
    </div>
  );
};
