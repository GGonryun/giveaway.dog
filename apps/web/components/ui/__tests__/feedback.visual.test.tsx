import { describe, expect, test } from 'vitest';
import { renderVisual, THEMES } from '@/test/visual/render';
import { Avatar, AvatarFallback } from '../avatar';
import { Progress } from '../progress';
import { Separator } from '../separator';
import { Skeleton } from '../skeleton';
import { Stepper } from '../stepper';

describe.each(THEMES)('Feedback (%s)', (theme) => {
  test('progress, skeleton, avatar and stepper', async () => {
    const root = await renderVisual(
      <div className="flex flex-col gap-4">
        <Progress value={0} />
        <Progress value={60} />
        <Progress value={100} />
        <Separator />
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Separator />
        <div className="flex gap-2">
          <Avatar>
            <AvatarFallback>GD</AvatarFallback>
          </Avatar>
          <Avatar className="size-12">
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
        </div>
        <Separator />
        <Stepper currentStep={2} totalSteps={3} />
      </div>,
      { theme }
    );
    await expect.element(root).toMatchScreenshot();
  });
});
