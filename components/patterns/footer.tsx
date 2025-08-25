import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon
} from 'lucide-react';
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

const defaultSections = [
  {
    title: 'Product',
    links: [
      { name: 'Overview', href: '#' },
      { name: 'Pricing', href: '#' },
      { name: 'Marketplace', href: '#' },
      { name: 'Features', href: '#' }
    ]
  },
  {
    title: 'Company',
    links: [
      { name: 'About', href: '#' },
      { name: 'Team', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Careers', href: '#' }
    ]
  },
  {
    title: 'Resources',
    links: [
      { name: 'Help', href: '#' },
      { name: 'Sales', href: '#' },
      { name: 'Advertise', href: '#' },
      { name: 'Privacy', href: '#' }
    ]
  }
];

const defaultSocialLinks = [
  {
    icon: <InstagramIcon className="size-5" />,
    href: '/instagram',
    label: 'Instagram'
  },
  {
    icon: <FacebookIcon className="size-5" />,
    href: '/facebook',
    label: 'Facebook'
  },
  {
    icon: <TwitterIcon className="size-5" />,
    href: '/twitter',
    label: 'Twitter'
  },
  {
    icon: <LinkedinIcon className="size-5" />,
    href: '/linkedin',
    label: 'LinkedIn'
  }
];

const defaultLegalLinks = [
  { name: 'Terms and Conditions', href: '/terms' },
  { name: 'Privacy Policy', href: '/privacy' }
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
              <a href={social.href} aria-label={social.label}>
                {social.icon}
              </a>
            </li>
          ))}
        </ul>
        <ul className="order-1 flex flex-col gap-2 md:order-2 md:flex-row">
          {legalLinks.map((link, idx) => (
            <li key={idx} className="hover:text-primary">
              <a href={link.href}> {link.name}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
