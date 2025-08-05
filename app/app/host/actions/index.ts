'use server';

import { time } from '@/lib/time';
import { GiveawayFormSchema } from '../schemas';

export const onSubmitAction = async (values: GiveawayFormSchema) => {
  console.log('Form submitted:', values);
  await time.wait(3000);
  throw new Error('Something bad happened!');
};
