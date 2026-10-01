import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Switch } from '../switch';

describe('Switch', () => {
  it('matches the snapshot when off', () => {
    const { container } = render(<Switch aria-label="Notifications" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches the snapshot when on', () => {
    const { container } = render(
      <Switch aria-label="Notifications" defaultChecked />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
