import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScrollArea, ScrollBar } from '../scroll-area';

describe('ScrollArea', () => {
  it('renders its children inside the scrollable viewport', () => {
    const { container } = render(
      <ScrollArea>
        <p>Long content</p>
      </ScrollArea>
    );
    const viewport = container.querySelector(
      '[data-radix-scroll-area-viewport]'
    );
    expect(viewport).toHaveClass('h-full', 'w-full');
    expect(viewport).toContainElement(screen.getByText('Long content'));
  });

  it('merges a custom class name on the root', () => {
    const { container } = render(
      <ScrollArea className="h-72 rounded-md border">
        <p>Long content</p>
      </ScrollArea>
    );
    expect(container.firstChild).toHaveClass(
      'relative',
      'overflow-hidden',
      'h-72',
      'border'
    );
  });

  it('renders a vertical scrollbar when scrollbars are always visible', () => {
    const { container } = render(
      <ScrollArea type="always">
        <p>Long content</p>
      </ScrollArea>
    );
    const scrollbar = container.querySelector('[data-orientation="vertical"]');
    expect(scrollbar).toHaveClass('h-full', 'w-2.5', 'border-l');
  });

  it('styles a horizontal scrollbar', () => {
    const { container } = render(
      <ScrollArea type="always">
        <p>Wide content</p>
        <ScrollBar orientation="horizontal" className="bg-muted" />
      </ScrollArea>
    );
    const scrollbar = container.querySelector(
      '[data-orientation="horizontal"]'
    );
    expect(scrollbar).toHaveClass('h-2.5', 'flex-col', 'border-t', 'bg-muted');
    expect(scrollbar).not.toHaveClass('w-2.5');
  });
});
