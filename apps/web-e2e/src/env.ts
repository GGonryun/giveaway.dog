import path from 'path';
import { randomInt } from 'crypto';
import type { E2ePersona } from '@giveaway/e2e-model/personas';

export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

export const E2E_SECRET = process.env.E2E_LOGIN_SECRET ?? '';

const AUTH_DIR = path.join(__dirname, '.auth');

export const BYPASS_STATE = path.join(AUTH_DIR, 'vercel.json');

export const personaState = (persona: E2ePersona) =>
  path.join(AUTH_DIR, `${persona}.json`);

const newRunId = () =>
  Array.from({ length: 6 }, () => randomInt(36).toString(36)).join('');

export const RUN_ID = (process.env.E2E_RUN_ID ||= newRunId());

if (!/^[a-z0-9]{6}$/.test(RUN_ID)) {
  throw new Error(
    `E2E_RUN_ID must be 6 characters from a-z and 0-9, not "${RUN_ID}"`
  );
}
