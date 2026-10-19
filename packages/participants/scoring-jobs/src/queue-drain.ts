import 'server-only';

import prisma from '@giveaway/db-client/prisma';
import { start } from 'workflow/api';
import { QUEUE_DRAIN_STALE_MS, QueueName } from './queue-drain-config';

export const ensureQueueDrain = async (
  name: QueueName,
  workflow: () => Promise<void>
) => {
  try {
    await prisma.queueDrain.upsert({
      where: { name },
      create: { name, requests: 1 },
      update: { requests: { increment: 1 }, requestedAt: new Date() }
    });

    const claim = await prisma.queueDrain.updateMany({
      where: {
        name,
        OR: [
          { running: false },
          { heartbeatAt: { lt: new Date(Date.now() - QUEUE_DRAIN_STALE_MS) } }
        ]
      },
      data: { running: true, runId: null, heartbeatAt: new Date() }
    });
    if (claim.count === 0) return;

    let runId: string;
    try {
      ({ runId } = await start(workflow));
    } catch (error) {
      await prisma.queueDrain.update({
        where: { name },
        data: { running: false }
      });
      throw error;
    }

    await prisma.queueDrain.update({ where: { name }, data: { runId } });
  } catch (error) {
    console.error(`Failed to start the ${name} queue drain:`, error);
  }
};

export const touchQueueDrain = async (name: QueueName) => {
  await prisma.queueDrain.updateMany({
    where: { name },
    data: { heartbeatAt: new Date() }
  });
};
