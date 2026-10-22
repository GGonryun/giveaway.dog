import { z } from 'zod';

export const E2E_CREDITS_SECRET_COOKIE = 'e2e-credits';

export const E2E_CREDITS_POOL_COOKIE = 'e2e-credits-pool';

export const e2eCreditPoolSchema = z.string().regex(/^[a-z0-9-]{4,40}$/);
