'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, Share2, Trophy } from 'lucide-react';

interface Winner {
  id: string;
  drawId: string;
  twitterUserId: string;
  twitterUsername: string;
  twitterDisplayName: string;
  twitterProfileImageUrl: string | null;
  position: number;
  selectedAt: Date;
}

interface PickerWinnerCardProps {
  winner: Winner;
  drawId: string;
  pickerId: string;
}

export const PickerWinnerCard: React.FC<PickerWinnerCardProps> = ({
  winner,
  drawId,
  pickerId
}) => {
  const handleShare = () => {
    const tweetText = `🎉 Congratulations to @${winner.twitterUsername} for winning our giveaway!\n\nVerify the draw: ${window.location.origin}/pickers/${pickerId}/draws/${drawId}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={winner.twitterProfileImageUrl ?? undefined} />
                <AvatarFallback>
                  {winner.twitterDisplayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {winner.position === 1 && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                  <Trophy className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {winner.twitterDisplayName}
                </span>
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <span className="text-sm text-muted-foreground">
                @{winner.twitterUsername}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://x.com/${winner.twitterUsername}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Profile
              </a>
            </Button>
            <Button variant="default" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
