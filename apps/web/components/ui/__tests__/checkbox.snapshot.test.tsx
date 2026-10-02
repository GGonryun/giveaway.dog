import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Checkbox } from '../checkbox';

describe('Checkbox', () => {
  it('matches the snapshot when unchecked', () => {
    const { container } = render(<Checkbox aria-label="Accept terms" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches the snapshot when checked', () => {
    const { container } = render(
      <Checkbox aria-label="Accept terms" defaultChecked />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
