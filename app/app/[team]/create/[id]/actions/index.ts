'use server';

import { time } from '@/lib/time';
import { GiveawaySchema } from '@/schemas/giveaway';

export const onSubmitAction = async (values: GiveawaySchema) => {
  console.log('Form submitted:', values);
  await time.wait(3000);
  throw new Error('Something bad happened!');
};
