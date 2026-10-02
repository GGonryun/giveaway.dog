import { describe, expect, test } from 'vitest';
import { CircleAlert } from 'lucide-react';
import { renderVisual, THEMES } from '@/test/visual/render';
import { Alert, AlertDescription, AlertTitle } from '../alert';

const VARIANTS = [
  'default',
  'primary',
  'destructive',
  'info',
  'success',
  'warning'
] as const;

describe.each(THEMES)('Alert (%s)', (theme) => {
  test('variants', async () => {
    const root = await renderVisual(
      <div className="flex flex-col gap-3">
        {VARIANTS.map((variant) => (
          <Alert key={variant} variant={variant}>
            <CircleAlert />
            <AlertTitle>The {variant} alert</AlertTitle>
            <AlertDescription>
              Your giveaway ends in 3 days. Pick the winners before then.
            </AlertDescription>
          </Alert>
        ))}
      </div>,
      { theme }
    );
    await expect.element(root).toMatchScreenshot();
  });
});
