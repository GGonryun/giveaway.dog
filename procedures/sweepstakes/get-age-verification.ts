'use server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function getAgeVerification(sweepstakesId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  try {
    const ageVerification = await prisma.ageVerification.findUnique({
      where: {
        userId_sweepstakesId: {
          userId: session.user.id,
          sweepstakesId
        }
      }
    });

    return ageVerification;
  } catch (error) {
    console.error('Failed to get age verification:', error);
    return null;
  }
}
