import { describe, expect, test } from 'vitest';
import { Mail } from 'lucide-react';
import { renderVisual, THEMES, VisualGrid } from '@/test/visual/render';
import { Button } from '../button';

const VARIANTS = [
  'default',
  'success',
  'destructive',
  'warning',
  'outline',
  'secondary',
  'ghost',
  'link'
] as const;

describe.each(THEMES)('Button (%s)', (theme) => {
  test('variants', async () => {
    const root = await renderVisual(
      <VisualGrid columns={4}>
        {VARIANTS.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </VisualGrid>,
      { theme, width: 560 }
    );
    await expect.element(root).toMatchScreenshot();
  });

  test('sizes and states', async () => {
    const root = await renderVisual(
      <div className="flex flex-wrap items-center gap-4">
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="Email">
          <Mail />
        </Button>
        <Button disabled>Disabled</Button>
        <Button>
          <Mail /> With icon
        </Button>
      </div>,
      { theme, width: 560 }
    );
    await expect.element(root).toMatchScreenshot();
  });
});
