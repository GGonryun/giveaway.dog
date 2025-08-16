'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { BotDetectionData } from '../shared/types';
import { simulateNetworkDelay } from '../shared/utils';

const getBotDetection = async (): Promise<BotDetectionData[]> => {
  'use cache';
  cacheTag('bot-detection');

  await simulateNetworkDelay();

  const mockBotDetection: BotDetectionData[] = [
    { name: 'Legitimate Entries', value: 1089, fill: 'hsl(142, 76%, 36%)' },
    { name: 'Filtered/Bot Entries', value: 158, fill: 'hsl(0, 84%, 60%)' }
  ];

  return mockBotDetection;
};

export default getBotDetection;
