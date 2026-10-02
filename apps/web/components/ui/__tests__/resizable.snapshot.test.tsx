import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '../resizable';
import { withStableIds } from './test-utils';

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
  it('matches the snapshot with a visible handle', () => {
    const { container } = renderPanels({ withHandle: true });
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });
});
