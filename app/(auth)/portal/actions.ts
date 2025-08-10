'use server';

import prisma from '@/lib/prisma';

interface UpdateUserProfileParams {
  userId: string;
  name?: string;
}

export async function updateUserProfile(params: UpdateUserProfileParams) {
  const { userId, name } = params;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name
      }
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return { error: 'Failed to update profile' };
  }
}
