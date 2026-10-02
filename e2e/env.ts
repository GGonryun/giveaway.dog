import path from 'path';

export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

export const BYPASS_STATE = path.join(__dirname, '.auth', 'vercel.json');
