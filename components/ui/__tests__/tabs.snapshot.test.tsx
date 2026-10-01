import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';
import { withStableIds } from './test-utils';

function renderTabs(onValueChange = vi.fn()) {
  const result = render(
    <Tabs defaultValue="entries" onValueChange={onValueChange}>
      <TabsList aria-label="Giveaway sections">
        <TabsTrigger value="entries">Entries</TabsTrigger>
        <TabsTrigger value="winners">Winners</TabsTrigger>
        <TabsTrigger value="settings" disabled>
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="entries">Entries panel</TabsContent>
      <TabsContent value="winners">Winners panel</TabsContent>
      <TabsContent value="settings">Settings panel</TabsContent>
    </Tabs>
  );
  return { ...result, onValueChange };
}

describe('Tabs', () => {
  it('matches the snapshot', () => {
    const { container } = renderTabs();
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });
});
