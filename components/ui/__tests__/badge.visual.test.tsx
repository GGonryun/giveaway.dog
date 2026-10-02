import { describe, expect, test } from 'vitest';
import { renderVisual, THEMES } from '@/test/visual/render';
import { Badge } from '../badge';

const VARIANTS = [
  'default',
  'secondary',
  'destructive',
  'info',
  'warning',
  'outline',
  'success'
] as const;

describe.each(THEMES)('Badge (%s)', (theme) => {
  test('variants', async () => {
    const root = await renderVisual(
      <div className="flex flex-wrap gap-2">
        {VARIANTS.map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
      </div>,
      { theme }
    );
    await expect.element(root).toMatchScreenshot();
  });
});
