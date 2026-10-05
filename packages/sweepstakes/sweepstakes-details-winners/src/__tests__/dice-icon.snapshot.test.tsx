import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiceIcon } from '../dice-icon';

describe('DiceIcon', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches the snapshot while idle', () => {
    const { container } = render(<DiceIcon isRolling={false} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
