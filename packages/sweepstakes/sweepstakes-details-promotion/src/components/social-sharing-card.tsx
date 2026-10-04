import { Button } from '@giveaway/ui-primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@giveaway/ui-primitives/card';
import { SocialFacebookIcon } from '@giveaway/integration-icons/facebook-icon';
import { SocialInstagramIcon } from '@giveaway/integration-icons/instagram';
import { SocialXIcon } from '@giveaway/integration-icons/x-icon';
import React from 'react';

const socialPlatforms = [
  {
    name: 'Facebook',
    icon: SocialFacebookIcon,
    color: 'text-blue-600',
    url: ({ liveUrl }: SocialSharingCardProps) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(liveUrl)}`
  },
  {
    name: 'Twitter',
    icon: SocialXIcon,
    color: 'text-sky-500',
    url: ({ liveUrl, sweepstakesName }: SocialSharingCardProps) =>
      `https://x.com/intent/tweet?url=${encodeURIComponent(liveUrl)}&text=${encodeURIComponent(`Check out this giveaway: ${sweepstakesName}`)}`
  },
  {
    name: 'Instagram',
    icon: SocialInstagramIcon,
    color: 'text-pink-500',
    url: () => `https://www.instagram.com`
  }
];

type SocialSharingCardProps = { liveUrl: string; sweepstakesName: string };

export const SocialSharingCard: React.FC<SocialSharingCardProps> = (props) => (
  <Card>
    <CardHeader>
      <CardTitle>Social Sharing</CardTitle>
      <CardDescription>
        Share your sweepstakes across social media platforms
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid gap-3 md:grid-cols-3">
        {socialPlatforms.map((platform) => {
          const Icon = platform.icon;
          return (
            <Button
              key={platform.name}
              variant="outline"
              asChild
              className="justify-start"
            >
              <a
                href={platform.url(props)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon className={`h-4 w-4 mr-2 ${platform.color}`} />
                Share on {platform.name}
              </a>
            </Button>
          );
        })}
      </div>
    </CardContent>
  </Card>
);
