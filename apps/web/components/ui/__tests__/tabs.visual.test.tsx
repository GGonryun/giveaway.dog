import { describe, expect, test } from 'vitest';
import { renderVisual, THEMES } from '@/test/visual/render';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';

describe.each(THEMES)('Tabs (%s)', (theme) => {
  test('with the first tab selected', async () => {
    const root = await renderVisual(
      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="winners">Winners</TabsTrigger>
          <TabsTrigger value="settings" disabled>
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="entries">1,204 entries</TabsContent>
        <TabsContent value="winners">No winners yet</TabsContent>
      </Tabs>,
      { theme }
    );
    await expect.element(root).toMatchScreenshot();
  });
});
