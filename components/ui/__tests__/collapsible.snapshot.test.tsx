import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '../collapsible';
import { withStableIds } from './test-utils';

function renderCollapsible(
  props: React.ComponentProps<typeof Collapsible> = {}
) {
  return render(
    <Collapsible {...props}>
      <CollapsibleTrigger>Show rules</CollapsibleTrigger>
      <CollapsibleContent>One entry per person.</CollapsibleContent>
    </Collapsible>
  );
}

describe('Collapsible', () => {
  it('matches the snapshot when open', () => {
    const { container } = renderCollapsible({ defaultOpen: true });
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });
});
