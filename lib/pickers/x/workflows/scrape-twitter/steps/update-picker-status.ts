import prisma from '@/lib/prisma';
import { PickerStatus } from '@prisma/client';

export async function updatePickerStatus({
  pickerId,
  status
}: {
  pickerId: string;
  status: PickerStatus;
}) {
  'use step';

  await prisma.twitterPicker.update({
    where: { id: pickerId },
    data: { status }
  });
}
