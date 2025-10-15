import { procedure } from '@/lib/mrpc/procedures';
import {
  INCLUDE_USER_DEVICE_AGENT_QUERY,
  toUserDeviceActivity,
  userDeviceActivitySchema
} from '@/schemas/user-agent';
import { z } from 'zod';

const getUserDeviceActivity = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      userId: z.string()
    })
  )
  .output(userDeviceActivitySchema.array())
  .handler(async ({ db, input }) => {
    const devices = await db.userAgent.findMany({
      where: {
        userId: input.userId
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: INCLUDE_USER_DEVICE_AGENT_QUERY
    });

    if (devices) {
      return devices.map(toUserDeviceActivity);
    }

    return [];
  });

export default getUserDeviceActivity;
