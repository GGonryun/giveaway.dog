import 'server-only';

import prisma from '@giveaway/db-client/prisma';
import { QueueName } from './queue-drain-config';

export async function beginQueueDrainPass({ name }: { name: QueueName }) {
  'use step';

  const drain = await prisma.queueDrain.upsert({
    where: { name },
    create: { name, running: true },
    update: { heartbeatAt: new Date() }
  });

  return drain.requests;
}

export async function finishQueueDrainPass({
  name,
  requests
}: {
  name: QueueName;
  requests: number;
}) {
  'use step';

  const { count } = await prisma.queueDrain.updateMany({
    where: { name, requests },
    data: { running: false, runId: null }
  });

  return count > 0;
}
