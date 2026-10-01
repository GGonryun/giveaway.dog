import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ObfuscatedEmail } from '../obfuscated-email';

describe('ObfuscatedEmail', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches the snapshot', () => {
    const { container } = render(<ObfuscatedEmail email="jane@example.com" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
