import {
  X,
  BadgeCheck,
  MessageCircle,
  Repeat2,
  Heart,
  Eye,
  ClockIcon,
  ExternalLink,
  ImageIcon
} from 'lucide-react';
import { Card, CardContent } from '@giveaway/ui-primitives/card';
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@giveaway/ui-primitives/avatar';
import { Button } from '@giveaway/ui-primitives/button';

interface TweetPreviewCardProps {
  tweetData: {
    id: string;
    text: string;
    username: string | null;
    profileImageUrl: string | null;
    isBlueVerified: boolean;
    media: Array<{
      url: string;
      width: number;
      height: number;
      altText: string | null;
    }>;
    replyCount: number | null;
    retweetCount: number | null;
    favoriteCount: number | null;
    viewCount: number | null;
    quoteCount: number | null;
    createdAt: string;
  };
  onChangeClick: () => void;
}

export const TweetPreviewCard: React.FC<TweetPreviewCardProps> = ({
  tweetData,
  onChangeClick
}) => {
  return (
    <Card className="bg-muted/50">
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={
                  tweetData.profileImageUrl ||
                  `https://avatar.vercel.sh/${tweetData.username}`
                }
                alt={`@${tweetData.username}`}
              />
              <AvatarFallback>
                {tweetData.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <a
                    href={`https://x.com/${tweetData.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium truncate hover:underline"
                  >
                    @{tweetData.username || 'unknown'}
                  </a>
                  {tweetData.isBlueVerified && (
                    <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onChangeClick}
                >
                  <X className="h-3 w-3 mr-1" />
                  Change
                </Button>
              </div>
              {tweetData.text && (
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {tweetData.text}
                </p>
              )}
              {tweetData.media && tweetData.media.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {tweetData.media.map((media, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-video rounded-md overflow-hidden bg-muted group"
                    >
                      <img
                        src={media.url}
                        alt={media.altText || 'Tweet image'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-3">
                {tweetData.replyCount !== null && (
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 mb-px" />
                    {tweetData.replyCount}
                  </span>
                )}
                {tweetData.retweetCount !== null && (
                  <span className="flex items-center gap-1">
                    <Repeat2 className="h-3 w-3 mb-px" />
                    {tweetData.retweetCount}
                  </span>
                )}
                {tweetData.favoriteCount !== null && (
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3 mb-px" />
                    {tweetData.favoriteCount}
                  </span>
                )}
                {tweetData.viewCount !== null && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3 mb-px" />
                    {tweetData.viewCount.toLocaleString()}
                  </span>
                )}
              </div>
              {tweetData.createdAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3 mb-px" />
                    {new Date(tweetData.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                  <span>•</span>
                  <a
                    href={`https://x.com/${tweetData.username}/status/${tweetData.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline flex items-center gap-1"
                  >
                    Link to Post
                    <ExternalLink className="h-3 w-3 mb-px" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
