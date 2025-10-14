import { procedure } from '@/lib/mrpc/procedures';
import { userDeviceActivitySchema } from '@/schemas/user-agent';
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
    return [];
  });

export default getUserDeviceActivity;
