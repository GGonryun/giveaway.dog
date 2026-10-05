import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import createTeam from '@giveaway/team-server/create-team';
import { CreateTeamForm } from '../create-team-form';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  useSearchParams: () => navigation.searchParams
}));

vi.mock('@giveaway/team-server/create-team', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

vi.mock('@giveaway/ui-file-upload/file-upload', () => ({
  FileUpload: ({
    initialUrl,
    onUpload
  }: {
    initialUrl?: string;
    onUpload?: (url: string) => void;
  }) => (
    <div data-testid="file-upload" data-initial-url={initialUrl ?? ''}>
      <button
        type="button"
        onClick={() => onUpload?.('https://blob.example.com/logo.png')}
      >
        Upload file
      </button>
    </div>
  )
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

describe('CreateTeamForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.searchParams = new URLSearchParams('step=2');
    vi.mocked(createTeam).mockResolvedValue({
      ok: true,
      data: { slug: 'doggo-club' }
    });
  });

  afterEach(() => {
    document.cookie = 'last_team_slug=; max-age=0; path=/';
  });

  it('matches the snapshot', () => {
    const { container } = render(<CreateTeamForm />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
