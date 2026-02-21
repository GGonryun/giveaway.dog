'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, Trophy, RotateCw } from 'lucide-react';
import { PickerWinnerSchema } from '../schemas/draws';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';

interface PickerWinnerCardProps {
  winner: PickerWinnerSchema;
  postUrl: string;
  pickerId: string;
  onRedraw?: () => void;
  showRedrawButton?: boolean;
}

export const PickerWinnerCard: React.FC<PickerWinnerCardProps> = ({
  winner,
  postUrl,
  onRedraw,
  pickerId,
  showRedrawButton = false
}) => {
  const username = winner.username || 'unknown';
  const name = winner.name || 'Unknown User';
  const profileImage = winner.profile_image_url || null;
  const replyToId = postUrl.split('/').pop() || '';

  const handleShare = () => {
    const tweetText = `🎉 Congratulations to @${username} for winning our giveaway!\n\nVerify the draw: ${window.location.origin}/pickers/twitter/${pickerId}`;
    const twitterUrl = `https://twitter.com/intent/tweet?in_reply_to=${replyToId}&text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profileImage ?? undefined} />
                <AvatarFallback>
                  {name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {winner.position === 1 && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                  <Trophy className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">{name}</span>
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <span className="text-sm text-muted-foreground truncate block">
                @{username}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap flex-col lg:flex-row gap-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://x.com/${username}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink />
                View Profile
              </a>
            </Button>
            <Button variant="default" size="sm" onClick={handleShare}>
              <SocialXIcon />
              Share Winner
            </Button>
          </div>

          {showRedrawButton && onRedraw && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onRedraw}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Redraw Winner
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
