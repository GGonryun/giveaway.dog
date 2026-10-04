import { SocialBlueskyIcon } from '@giveaway/integration-icons/bluesky-icon';
import { SocialFacebookIcon } from '@giveaway/integration-icons/facebook-icon';
import { SocialXIcon } from '@giveaway/integration-icons/x-icon';
import {
  BLUESKY_PROFILE_URL,
  FACEBOOK_PROFILE_URL,
  TWITTER_PROFILE_URL
} from '@giveaway/app-config/settings';

import Link from 'next/link';
import React from 'react';

interface FooterProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  sections?: Array<{
    title: string;
    links: Array<{ name: string; href: string }>;
  }>;
  description?: string;
  socialLinks?: Array<{
    icon: React.ReactElement;
    href: string;
    label: string;
  }>;
  copyright?: string;
  legalLinks?: Array<{
    name: string;
    href: string;
  }>;
}

const defaultSocialLinks = [
  {
    icon: <SocialFacebookIcon className="size-5" />,
    href: FACEBOOK_PROFILE_URL,
    label: 'Facebook'
  },
  {
    icon: <SocialXIcon className="size-5" />,
    href: TWITTER_PROFILE_URL,
    label: 'Twitter'
  },
  {
    icon: <SocialBlueskyIcon className="size-5" />,
    href: BLUESKY_PROFILE_URL,
    label: 'Bluesky'
  }
];

const defaultLegalLinks = [
  { name: 'Terms', href: '/terms' },
  { name: 'Privacy', href: '/privacy' }
];

export const Footer = ({
  socialLinks = defaultSocialLinks,
  copyright = `© ${new Date().getFullYear()} Giveaway.dog. All rights reserved.`,
  legalLinks = defaultLegalLinks
}: FooterProps) => {
  return (
    <div className="container">
      <div className="text-muted-foreground flex flex-col justify-between gap-4 py-8 text-xs font-medium md:flex-row md:items-center md:text-left">
        <p className="order-2 lg:order-1">{copyright}</p>

        <ul className="text-muted-foreground flex items-center space-x-6">
          {socialLinks.map((social, idx) => (
            <li key={idx} className="hover:text-primary font-medium">
              <Link
                href={social.href}
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
              >
                {social.icon}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="order-1 flex flex-col gap-2 md:order-2 md:flex-row">
          {legalLinks.map((link, idx) => (
            <li key={idx} className="hover:text-primary">
              <Link href={link.href}>{link.name}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
