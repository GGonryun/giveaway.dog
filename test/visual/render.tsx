import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { page } from 'vitest/browser';

export type VisualTheme = 'light' | 'dark';

export const THEMES: VisualTheme[] = ['light', 'dark'];

type RenderVisualOptions = {
  theme?: VisualTheme;
  width?: number;
};

export async function renderVisual(
  ui: ReactNode,
  { theme = 'light', width = 480 }: RenderVisualOptions = {}
) {
  document.documentElement.classList.add(theme);
  render(
    <div
      data-testid="visual-root"
      className="bg-background text-foreground font-sans p-4"
      style={{ width }}
    >
      {ui}
    </div>
  );
  await document.fonts.ready;
  return page.getByTestId('visual-root');
}

export function VisualGrid({
  children,
  columns = 1
}: {
  children: ReactNode;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}
