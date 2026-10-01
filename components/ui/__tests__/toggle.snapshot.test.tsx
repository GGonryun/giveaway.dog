import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Toggle } from '../toggle';

describe('Toggle', () => {
  it('matches the snapshot when off', () => {
    const { container } = render(<Toggle aria-label="Bold">B</Toggle>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches the snapshot for the outline variant when on', () => {
    const { container } = render(
      <Toggle aria-label="Bold" variant="outline" size="lg" defaultPressed>
        B
      </Toggle>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
