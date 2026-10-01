import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('shows the panel of the default tab', () => {
    renderTabs();
    expect(screen.getByRole('tab', { name: 'Entries' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tabpanel', { name: 'Entries' })).toHaveTextContent(
      'Entries panel'
    );
    expect(screen.queryByText('Winners panel')).not.toBeInTheDocument();
  });

  it('switches panels when another tab is clicked', async () => {
    const { onValueChange } = renderTabs();
    await userEvent.click(screen.getByRole('tab', { name: 'Winners' }));
    expect(onValueChange).toHaveBeenCalledWith('winners');
    expect(screen.getByRole('tabpanel', { name: 'Winners' })).toHaveTextContent(
      'Winners panel'
    );
    expect(screen.queryByText('Entries panel')).not.toBeInTheDocument();
  });

  it('moves between tabs with the arrow keys', async () => {
    renderTabs();
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'Entries' })).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Winners' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Winners' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('does not activate a disabled tab', async () => {
    const { onValueChange } = renderTabs();
    const settings = screen.getByRole('tab', { name: 'Settings' });
    expect(settings).toBeDisabled();
    await userEvent.click(settings);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('wraps the tab list in a horizontally scrollable container', () => {
    renderTabs();
    const list = screen.getByRole('tablist', { name: 'Giveaway sections' });
    expect(list.parentElement).toHaveClass('overflow-x-auto');
    expect(list).toHaveAttribute('data-slot', 'tabs-list');
  });

  it('merges custom class names', () => {
    render(
      <Tabs defaultValue="a" className="gap-2">
        <TabsList className="w-full">
          <TabsTrigger value="a" className="grow">
            A
          </TabsTrigger>
        </TabsList>
        <TabsContent value="a" className="pt-4">
          Panel
        </TabsContent>
      </Tabs>
    );
    expect(screen.getByRole('tablist')).toHaveClass('w-full', 'bg-muted');
    expect(screen.getByRole('tab')).toHaveClass('grow', 'rounded-md');
    expect(screen.getByRole('tabpanel')).toHaveClass('pt-4', 'flex-1');
    expect(
      screen.getByRole('tablist').closest('[data-slot="tabs"]')
    ).toHaveClass('gap-2', 'flex-col');
  });
});
