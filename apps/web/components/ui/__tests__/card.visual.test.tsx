import { describe, expect, test } from 'vitest';
import { renderVisual, THEMES } from '@/test/visual/render';
import { Button } from '../button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '../card';

describe.each(THEMES)('Card (%s)', (theme) => {
  test('with all the sections', async () => {
    const root = await renderVisual(
      <Card>
        <CardHeader>
          <CardTitle>Summer giveaway</CardTitle>
          <CardDescription>1,204 entries from 863 people</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          Win a new gaming headset. Entries close on Friday at noon.
        </CardContent>
        <CardFooter className="gap-2">
          <Button>Pick winners</Button>
          <Button variant="secondary">Share</Button>
        </CardFooter>
      </Card>,
      { theme }
    );
    await expect.element(root).toMatchScreenshot();
  });
});
