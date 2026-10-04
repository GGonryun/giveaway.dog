import { render } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CopyLinkInput } from '../copy-link-input';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

const link = 'https://giveaway.dog/g/summer-bike';

describe('CopyLinkInput', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('matches the snapshot', () => {
    const { container } = render(<CopyLinkInput value={link} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
