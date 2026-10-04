import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionProvider } from '../auth-session-provider';

const nextAuth = vi.hoisted(() => ({
  providerProps: [] as Record<string, unknown>[]
}));

vi.mock('next-auth/react', () => ({
  SessionProvider: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  } & Record<string, unknown>) => {
    nextAuth.providerProps.push(props);
    return <div data-testid="next-auth-session-provider">{children}</div>;
  }
}));

describe('SessionProvider', () => {
  it('renders its children inside the next-auth session provider', () => {
    render(
      <SessionProvider>
        <p>Signed in content</p>
      </SessionProvider>
    );

    expect(screen.getByTestId('next-auth-session-provider')).toContainElement(
      screen.getByText('Signed in content')
    );
  });

  it('does not pass an initial session to next-auth', () => {
    nextAuth.providerProps.length = 0;

    render(
      <SessionProvider>
        <p>Content</p>
      </SessionProvider>
    );

    expect(nextAuth.providerProps).toEqual([{}]);
  });

  it('renders multiple children', () => {
    render(
      <SessionProvider>
        <p>First</p>
        <p>Second</p>
      </SessionProvider>
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});
