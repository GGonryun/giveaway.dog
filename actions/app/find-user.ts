import { auth } from '@/lib/auth';
import { procedure } from '@/lib/mrpc/procedures';
import { parseProviders, userProfileSchema } from '@/schemas/user';
import { unstable_cache } from 'next/cache';

const findUser = procedure
  .unauthorized()
  .output(userProfileSchema.nullable())
  .handler(async ({ db }) => {
    const session = await auth();
    if (!session?.user?.id) return null;

    const getCachedUserData = unstable_cache(
      async (userId: string) => {
        const userData = await db.user.findUnique({
          where: { id: userId },
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
          return null;
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
      },
      [`user-${session.user.id}`],
      {
        tags: [`user-${session.user.id}`, 'user-profile'],
        revalidate: 3600 // 1 hour
      }
    );

    const data = await getCachedUserData(session.user.id);
    return data;
  });

export default findUser;
