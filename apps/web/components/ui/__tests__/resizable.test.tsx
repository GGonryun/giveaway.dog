import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '../resizable';

function renderPanels(
  props: {
    direction?: 'horizontal' | 'vertical';
    withHandle?: boolean;
    disabled?: boolean;
  } = {}
) {
  return render(
    <ResizablePanelGroup
      direction={props.direction ?? 'horizontal'}
      className="min-h-40"
    >
      <ResizablePanel defaultSize={30}>Sidebar</ResizablePanel>
      <ResizableHandle
        withHandle={props.withHandle}
        disabled={props.disabled}
      />
      <ResizablePanel defaultSize={70}>Content</ResizablePanel>
    </ResizablePanelGroup>
  );
}

describe('Resizable', () => {
  it('lays out the panels with their default sizes', () => {
    renderPanels();
    const sidebar = screen.getByText('Sidebar');
    const content = screen.getByText('Content');
    expect(sidebar).toHaveAttribute('data-slot', 'resizable-panel');
    expect(sidebar).toHaveAttribute('data-panel-size', '30.0');
    expect(content).toHaveAttribute('data-panel-size', '70.0');
  });

  it('marks the group direction and merges a custom class name', () => {
    const { container } = renderPanels({ direction: 'vertical' });
    const group = container.firstChild;
    expect(group).toHaveAttribute('data-panel-group-direction', 'vertical');
    expect(group).toHaveClass('min-h-40', 'flex', 'h-full', 'w-full');
    expect(screen.getByRole('separator')).toHaveAttribute(
      'data-panel-group-direction',
      'vertical'
    );
  });

  it('renders a focusable separator between the panels', () => {
    renderPanels();
    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('tabindex', '0');
    expect(handle).toHaveAttribute('data-slot', 'resizable-handle');
    expect(handle).toHaveAttribute('data-panel-resize-handle-enabled', 'true');
  });

  it('shows a grip only when withHandle is set', () => {
    const { unmount } = renderPanels();
    expect(screen.getByRole('separator')).toBeEmptyDOMElement();
    unmount();

    renderPanels({ withHandle: true });
    expect(
      screen.getByRole('separator').querySelector('svg')
    ).toBeInTheDocument();
  });

  it('marks a disabled handle', () => {
    renderPanels({ disabled: true });
    expect(screen.getByRole('separator')).toHaveAttribute(
      'data-panel-resize-handle-enabled',
      'false'
    );
  });
});
