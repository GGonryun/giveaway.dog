import { procedure } from '@/lib/mrpc/procedures';
import { parseProviders, userProfileSchema } from '@/schemas/user';

const getUser = procedure
  .authorized()
  .output(userProfileSchema)
  .handler(async ({ user, db }) => {
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        emoji: true,
        region: true,
        age: true,
        emailVerified: true,
        type: true,
        accounts: {
          select: { provider: true }
        }
      }
    });

    if (!userData) {
      throw new Error('User not found');
    }

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      emoji: userData.emoji,
      region: userData.region,
      age: userData.age,
      emailVerified: !!userData.emailVerified,
      type: userData.type,
      providers: parseProviders(
        userData.accounts.map((account) => account.provider)
      )
    };
  });
export default getUser;
