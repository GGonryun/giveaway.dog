import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicXPickerForm } from '../public-x-picker-form';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/pickers/x'
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const POST_URL = 'https://x.com/someone/status/1234567890';

const tweet = {
  id: '1234567890',
  text: 'A giveaway post',
  username: 'someone',
  profileImageUrl: null,
  isBlueVerified: false,
  userId: '1',
  media: [],
  replyCount: 1,
  retweetCount: 2,
  favoriteCount: 3,
  viewCount: 4,
  quoteCount: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  estimatedDurationMs: 1000
};

const json = (status: number, body: unknown, headers?: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });

const fetchMock = vi.fn<typeof fetch>();

const loadTweet = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByRole('textbox', { name: 'Post URL' }), POST_URL);
  await user.click(screen.getByRole('button', { name: 'Load Tweet' }));
};

describe('PublicXPickerForm', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.mocked(toast.error).mockClear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the message of a load error that the route returns as an object', async () => {
    fetchMock.mockResolvedValueOnce(
      json(500, {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      })
    );
    const user = userEvent.setup();
    render(<PublicXPickerForm />);

    await loadTweet(user);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred')
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/pickers/x/public/load-tweet',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ postUrl: POST_URL })
      })
    );
    expect(screen.getByRole('button', { name: 'Load Tweet' })).toBeEnabled();
  });

  it('shows the message of a load error that the route returns as a string', async () => {
    fetchMock.mockResolvedValueOnce(
      json(400, {
        success: false,
        error: 'Could not extract tweet ID from URL'
      })
    );
    const user = userEvent.setup();
    render(<PublicXPickerForm />);

    await loadTweet(user);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Could not extract tweet ID from URL'
      )
    );
  });

  it('opens the rate limit dialog when the daily credits are used up', async () => {
    fetchMock.mockResolvedValueOnce(
      json(429, { success: false }, { 'Retry-After': '90' })
    );
    const user = userEvent.setup();
    render(<PublicXPickerForm />);

    await loadTweet(user);

    const dialog = await screen.findByRole('dialog', {
      name: 'Rate Limit Reached'
    });
    expect(dialog).toHaveTextContent('1m 30s');
    expect(toast.error).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: 'Pick Winners' })
    ).not.toBeInTheDocument();
  });

  it('opens the pick error dialog when too few users pass the filters', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { success: true, data: tweet }))
      .mockResolvedValueOnce(
        json(400, {
          error: { code: 'BAD_REQUEST', message: 'Not enough eligible entries' }
        })
      );
    const user = userEvent.setup();
    render(<PublicXPickerForm />);

    await loadTweet(user);
    await user.click(
      await screen.findByRole('button', { name: 'Pick Winners' })
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'Not Enough Eligible Entries'
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/pickers/x/public/pick-winners',
      expect.objectContaining({ method: 'POST' })
    );
    await user.click(screen.getByRole('button', { name: 'Adjust Filters' }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Pick Winners' })).toBeEnabled();
  });
});
