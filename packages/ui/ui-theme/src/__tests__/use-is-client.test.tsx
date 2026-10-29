import { renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useIsClient } from '../use-is-client';

const IsClient = () => <span>{JSON.stringify(useIsClient())}</span>;

describe('useIsClient', () => {
  it('is false on the server', () => {
    expect(renderToString(<IsClient />)).toBe('<span>false</span>');
  });

  it('is true on the client', () => {
    expect(renderHook(() => useIsClient()).result.current).toBe(true);
  });
});
