import { isValidCronSecret } from '@/lib/jobs/util';
import { time } from '@/lib/time';
import { NextRequest, NextResponse } from 'next/server';
import { handleDiscordJob } from '.';
import { toDiscordInteraction } from '../schema';

export async function POST(request: NextRequest) {
  if (!isValidCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const command = toDiscordInteraction(body);
  // sleep for 3 seconds to ensure the job has time to process before responding
  await time.wait(3000);

  const result = await handleDiscordJob(command);

  await fetch(
    `https://discord.com/api/v10/webhooks/${command.application_id}/${command.token}/messages/@original`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    }
  );

  return NextResponse.json({ status: 'Job executed successfully' });
}
