import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import { handlePingCommand } from '../ping';

describe('handlePingCommand', () => {
  it('responds with a pong interaction callback', async () => {
    const response = handlePingCommand();

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ type: 1 });
  });

  it('responds with a json content type', () => {
    const response = handlePingCommand();

    expect(response.headers.get('content-type')).toBe('application/json');
  });
});
