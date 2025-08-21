'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { OrganizationData } from '@/schemas/index';
import { simulateNetworkDelay } from '@/lib/simulate';

interface ExtendedOrganizationData extends OrganizationData {
  website?: string;
  industry?: string;
  companySize?: string;
  headquarters?: string;
  founded?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
  };
  settings?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    dataProcessing: boolean;
    publicProfile: boolean;
  };
  subscription?: {
    plan: string;
    status: string;
    billingCycle: string;
    nextBillingDate: string;
    features: string[];
  };
}

const getOrganizationData = async (): Promise<ExtendedOrganizationData> => {
  'use cache';
  cacheTag('organization-data');

  await simulateNetworkDelay();

  // Mock organization data for organization management
  const mockOrgData: ExtendedOrganizationData = {
    name: 'Acme Giveaways Inc.',
    slug: 'acme-giveaways',
    description:
      'Leading provider of engaging giveaways and promotional campaigns that drive customer engagement and brand awareness.',
    timezone: 'America/New_York',
    locale: 'en-US',
    logo: '/images/logos/acme-logo.png',
    brandColor: '#3B82F6',
    website: 'https://acmegiveaways.com',
    industry: 'Marketing & Advertising',
    companySize: '51-200 employees',
    headquarters: 'New York, NY, USA',
    founded: '2019',
    socialLinks: {
      instagram: '@acmegiveaways',
      twitter: '@acmegiveaways',
      facebook: 'acmegiveaways',
      linkedin: 'company/acme-giveaways',
      youtube: '@acmegiveaways'
    },
    settings: {
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: true,
      dataProcessing: true,
      publicProfile: true
    },
    subscription: {
      plan: 'Professional',
      status: 'active',
      billingCycle: 'monthly',
      nextBillingDate: '2025-02-15T00:00:00Z',
      features: [
        'Unlimited Giveaways',
        'Advanced Analytics',
        'Custom Branding',
        'API Access',
        'Priority Support',
        'Fraud Detection',
        'Export Tools'
      ]
    }
  };

  return mockOrgData;
};

export default getOrganizationData;
