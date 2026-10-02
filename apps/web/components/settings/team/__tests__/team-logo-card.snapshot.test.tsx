import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import updateTeamLogo from '@/procedures/teams/update-team-logo';
import { TeamLogoCard } from '../team-logo-card';

vi.mock('@/procedures/teams/update-team-logo', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

vi.mock('@/components/ui/file-upload', () => ({
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
        onClick={() => onUpload?.('https://blob.example.com/new-logo.png')}
      >
        Upload file
      </button>
      <button type="button" onClick={() => onUpload?.('')}>
        Remove file
      </button>
    </div>
  )
}));

const INITIAL_LOGO = 'https://cdn.example.com/doggo.png';

const renderCard = (onUpdate = vi.fn()) => {
  const view = render(
    <TeamLogoCard
      slug="doggo-club"
      initialLogo={INITIAL_LOGO}
      onUpdate={onUpdate}
    />
  );
  return { ...view, onUpdate };
};

describe('TeamLogoCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateTeamLogo).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
  });

  it('matches the snapshot', () => {
    const { container } = renderCard();

    expect(container.firstChild).toMatchSnapshot();
  });
});
