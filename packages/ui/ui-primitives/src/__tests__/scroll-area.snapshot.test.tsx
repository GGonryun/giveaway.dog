import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScrollArea } from '../scroll-area';

describe('ScrollArea', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <ScrollArea className="h-40">
        <p>Long content</p>
      </ScrollArea>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
