import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import deleteUser from '@/procedures/user/delete-user';
import { DangerZone } from '../danger-zone';

vi.mock('@/procedures/user/delete-user', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

describe('DangerZone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deleteUser).mockResolvedValue({ ok: true, data: undefined });
  });

  it('matches the snapshot', () => {
    const { container } = render(<DangerZone />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
