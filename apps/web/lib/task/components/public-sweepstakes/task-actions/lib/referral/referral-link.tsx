'use client';

import { TaskActionProps, TaskContent } from '../../building-blocks';
import { Button } from '@giveaway/ui-primitives/button';
import { ReferralLinkTaskSchema } from '@/lib/task/schemas';
import { cn } from '@giveaway/ui-utils/utils';
import { useTaskTheme } from '../../../../theme';
import React, { useEffect, useState } from 'react';
import { Copy, Share2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@giveaway/ui-primitives/input';
import { Badge } from '@giveaway/ui-primitives/badge';
import pluralize from 'pluralize';
import { useGiveawayParticipation } from '@/components/sweepstakes/giveaway-participation-context';
import {
  DEFAULT_USER_REFERRAL,
  UserReferralSchema
} from '@giveaway/referrals-model/schemas';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@giveaway/ui-primitives/collapsible';

export const ReferralLinkTaskActionForm: React.FC<
  TaskActionProps<ReferralLinkTaskSchema>
> = ({ task }) => {
  const { theme } = useTaskTheme();
  const { sweepstakes, referral, onCreateReferral } =
    useGiveawayParticipation();
  const sweepstakesId = sweepstakes.id;
  const [loading, setLoading] = useState(false);
  const [referralData, setReferralData] = useState<UserReferralSchema>(
    DEFAULT_USER_REFERRAL
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (referral) {
      setReferralData(referral);
    }
  }, [referral]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setReferralData(
        await onCreateReferral({
          taskId: task.id,
          sweepstakesId
        })
      );
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate referral code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!referralData.link) return;
    try {
      await navigator.clipboard.writeText(referralData.link);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (!referralData.link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join this giveaway!',
          text: 'Use my referral link to enter this giveaway:',
          url: referralData.link
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  if (!referralData.code) {
    return (
      <TaskContent className="flex-col">
        <Button
          type="button"
          className={cn(theme.action)}
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Referral Code'}
        </Button>
      </TaskContent>
    );
  }

  return (
    <TaskContent className="w-full flex-col gap-4">
      <div className="w-full space-y-2">
        <p className="text-sm text-center font-medium">Your Referral Link</p>
        <div className="flex gap-2">
          <Input
            value={referralData.link || ''}
            readOnly
            className="font-mono text-sm"
          />
          <Button
            variant="outline"
            type="button"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            type="button"
            size="icon"
            onClick={handleShare}
            className="shrink-0"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ReferralMaximum task={task} referralData={referralData} />
    </TaskContent>
  );
};

const ReferralMaximum: React.FC<{
  task: ReferralLinkTaskSchema;
  referralData: UserReferralSchema;
}> = ({ task, referralData }) => {
  const [isOpen, setIsOpen] = useState(false);

  const maxReached =
    task.maximum !== null &&
    referralData.referrals.length >= (task.maximum ?? Infinity);
  const hasReferrals = referralData.referrals.length > 0;

  return (
    <div className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full text-left hover:bg-muted/50 transition-colors rounded-lg p-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {task.maximum !== null
                      ? `${referralData.referrals.length} / ${task.maximum} ${pluralize('referral', task.maximum)}`
                      : `${referralData.referrals.length} ${pluralize('referral', referralData.referrals.length)}`}
                  </p>
                  {!maxReached && (
                    <p className="text-xs text-muted-foreground">
                      {task.maximum
                        ? `Share your link to earn up to ${(task.maximum - referralData.referrals.length) * task.value} more ${pluralize('entry', (task.maximum - referralData.referrals.length) * task.value)}!`
                        : `Every referral earns you +${task.value} ${pluralize('entry', task.value)}!`}
                    </p>
                  )}
                  {maxReached && (
                    <Badge variant="secondary">Maximum Reached</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 justify-center">
                {isOpen ? (
                  <ChevronUp className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-3 py-2 border-b">
              <p className="text-xs font-medium text-muted-foreground">
                Referred Users
              </p>
            </div>
            {hasReferrals ? (
              <div className="divide-y max-h-48 overflow-y-auto">
                {referralData.referrals.map((referral, index) => (
                  <div
                    key={referral.user.id}
                    className="px-3 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-5">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium">
                        {referral.user.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No referrals yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Share your link to get started!
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
