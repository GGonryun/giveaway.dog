import { FatalError, getWritable } from 'workflow';
import { TwitterScrapeProgress } from '../../../schemas/workflow';
import { PickerStatus } from '@prisma/client';

export async function writeProgress({
  max,
  current,
  status
}: {
  max: number;
  current: number;
  status: PickerStatus;
}) {
  'use step';
  const writable = getWritable<TwitterScrapeProgress>();
  const writer = writable.getWriter();
  try {
    await writer.write({
      max,
      current,
      progress: Math.round((current / max) * 100),
      status
    });
  } catch (e) {
    console.error('Error writing progress:', e);
    throw new FatalError('Failed to write progress');
  } finally {
    writer.releaseLock();
  }
}
