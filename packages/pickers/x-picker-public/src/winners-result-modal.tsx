'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@giveaway/ui-primitives/dialog';
import { Button } from '@giveaway/ui-primitives/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@giveaway/ui-primitives/avatar';
import { ExternalLink, Share2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { environment } from '@giveaway/app-config/environment';

interface Winner {
  id: string;
  username: string;
  name: string;
  profileImageUrl: string;
  profileUrl: string;
}

interface WinnersResultModalProps {
  open: boolean;
  onClose: () => void;
  winners: Winner[];
  drawId: string;
  postId?: string;
  postAuthor: {
    username: string;
    name: string;
    profileUrl: string;
  };
  onReRoll?: () => void;
  isReRolling?: boolean;
}

export const WinnersResultModal: React.FC<WinnersResultModalProps> = ({
  open,
  onClose,
  winners,
  drawId,
  postId,
  postAuthor,
  onReRoll,
  isReRolling = false
}) => {
  const baseUrl = environment.appUrl();
  const drawUrl = `${baseUrl}/pickers/x/${drawId}`;

  const winnersText = winners.map((w) => `@${w.username}`).join(' ');
  const shareText = `Congrats ${winnersText} you won our giveaway! 

${drawUrl} `;

  const handleShare = () => {
    const params = new URLSearchParams({ text: shareText });
    if (postId) {
      params.set('in_reply_to', postId);
    }
    const twitterIntentUrl = `https://twitter.com/intent/tweet?${params.toString()}`;
    window.open(twitterIntentUrl, '_blank');
  };

  const isSingleWinner = winners.length === 1;
  const winner = isSingleWinner ? winners[0] : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Winners</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isSingleWinner && winner ? (
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={winner.profileImageUrl} alt={winner.name} />
                <AvatarFallback>{winner.username[0]}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-semibold text-lg">{winner.name}</h3>
                <a
                  href={winner.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @{winner.username}
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 justify-center">
              {winners.map((w) => (
                <a
                  key={w.id}
                  href={w.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @{w.username}
                </a>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex gap-2">
              {isSingleWinner && winner && (
                <Button asChild variant="outline" className="flex-1">
                  <a
                    href={winner.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Profile
                  </a>
                </Button>
              )}
              <Button onClick={handleShare} className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
            {onReRoll && (
              <Button
                onClick={onReRoll}
                variant="outline"
                className="w-full"
                disabled={isReRolling}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isReRolling ? 'animate-spin' : ''}`}
                />
                {isReRolling ? 'Re-rolling...' : 'Re-roll Winners'}
              </Button>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="text-center">
              <Link
                href={`/pickers/x/${drawId}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Verify the Draw: {drawId}
              </Link>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Winner from Post by{' '}
              <a
                href={postAuthor.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @{postAuthor.username}
              </a>
            </div>

            <div className="text-center">
              <Link
                href={`/pickers/x/${drawId}`}
                className="text-sm text-primary hover:underline"
              >
                View Details →
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
