import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const searchParams = vi.hoisted(() => ({ value: new URLSearchParams() }));

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParams.value
}));

vi.mock('../login-options', () => ({
  LoginOptions: ({ redirectTo }: { redirectTo?: string }) => (
    <output aria-label="redirect target">{redirectTo}</output>
  )
}));

const { LoginForm } = await import('../login-form');

const renderWithSearch = (search: string, host = 'www.giveaway.dog') => {
  searchParams.value = new URLSearchParams(search);
  render(<LoginForm host={host} />);
  return screen.getByRole('status', { name: 'redirect target' });
};

describe('LoginForm', () => {
  beforeEach(() => {
    searchParams.value = new URLSearchParams();
  });

  it('passes the redirectTo parameter on', () => {
    expect(renderWithSearch('redirectTo=/browse/abc')).toHaveTextContent(
      '/browse/abc'
    );
  });

  it('passes the path of a callbackUrl on the same host on', () => {
    const search = new URLSearchParams({
      callbackUrl: 'https://www.giveaway.dog/account/history?tab=all'
    });
    expect(renderWithSearch(search.toString())).toHaveTextContent(
      '/account/history?tab=all'
    );
  });

  it('prefers redirectTo to callbackUrl', () => {
    const search = new URLSearchParams({
      redirectTo: '/browse/abc',
      callbackUrl: 'https://www.giveaway.dog/account/history'
    });
    expect(renderWithSearch(search.toString())).toHaveTextContent(
      '/browse/abc'
    );
  });

  it('ignores a callbackUrl on another host', () => {
    const search = new URLSearchParams({
      callbackUrl: 'https://evil.example.com/account/history'
    });
    expect(renderWithSearch(search.toString())).toBeEmptyDOMElement();
  });

  it('passes no target without either parameter', () => {
    expect(renderWithSearch('')).toBeEmptyDOMElement();
  });
});
