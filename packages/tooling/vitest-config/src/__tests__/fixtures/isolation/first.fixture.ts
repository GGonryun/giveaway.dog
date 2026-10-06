import { expect, it, vi } from 'vitest';
import { hook } from './hooks.ts';
import { read } from './reader.ts';

vi.mock('./dependency.ts', () => ({ value: 'first' }));

it('runs the hooks of the setup files before its first test', () => {
  expect(hook.runs).toBe(1);
});

it('reads the mock of this file', () => {
  expect(read()).toBe('first');
});

it('starts with real timers and no stubbed global or variable', () => {
  expect(vi.isFakeTimers()).toBe(false);
  expect(globalThis).not.toHaveProperty('fixtureGlobal');
  expect(process.env.FIXTURE_VARIABLE).toBeUndefined();

  vi.useFakeTimers();
  vi.stubGlobal('fixtureGlobal', 'first');
  vi.stubEnv('FIXTURE_VARIABLE', 'first');
});
