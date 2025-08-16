'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { LocationData } from '../shared/types';
import { simulateNetworkDelay } from '../shared/utils';

interface GetGeolocationDataParams {
  countryFilter?: string;
}

const getGeolocationData = async (
  params: GetGeolocationDataParams = {}
): Promise<LocationData[]> => {
  'use cache';
  cacheTag('geolocation-data');

  await simulateNetworkDelay();

  const mockLocationData: LocationData[] = [
    {
      country: 'United States',
      state: 'California',
      entries: 2340,
      percentage: 18.7,
      flag: '🇺🇸'
    },
    {
      country: 'United States',
      state: 'Texas',
      entries: 1890,
      percentage: 15.1,
      flag: '🇺🇸'
    },
    {
      country: 'United States',
      state: 'New York',
      entries: 1567,
      percentage: 12.5,
      flag: '🇺🇸'
    },
    {
      country: 'Canada',
      state: 'Ontario',
      entries: 890,
      percentage: 7.1,
      flag: '🇨🇦'
    },
    { country: 'United Kingdom', entries: 567, percentage: 4.5, flag: '🇬🇧' },
    { country: 'Australia', entries: 456, percentage: 3.6, flag: '🇦🇺' },
    { country: 'Germany', entries: 345, percentage: 2.8, flag: '🇩🇪' },
    { country: 'France', entries: 234, percentage: 1.9, flag: '🇫🇷' },
    { country: 'Japan', entries: 189, percentage: 1.5, flag: '🇯🇵' },
    { country: 'Brazil', entries: 156, percentage: 1.2, flag: '🇧🇷' }
  ];

  return mockLocationData;
};

export default getGeolocationData;
