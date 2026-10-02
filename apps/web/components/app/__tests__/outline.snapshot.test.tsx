import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
import { Outline } from '../outline';

const SidebarState = () => {
  const { state } = useSidebar();
  return <output aria-label="sidebar state">{state}</output>;
};

const renderOutline = (props: Partial<React.ComponentProps<typeof Outline>>) =>
  render(
    <SidebarProvider>
      <Outline title="Settings" {...props}>
        <p>Page content</p>
      </Outline>
      <SidebarState />
    </SidebarProvider>
  );

describe('Outline', () => {
  it('matches the snapshot with a breadcrumb title and an action', () => {
    const { container } = renderOutline({
      title: [{ href: '/app/acme', label: 'Sweepstakes' }, { label: 'Edit' }],
      action: <button type="button">Share</button>
    });
    expect(stabilizeIds(container)).toMatchSnapshot();
  });
});
