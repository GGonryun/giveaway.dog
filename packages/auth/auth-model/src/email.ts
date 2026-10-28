import z from 'zod';

export const INVALID_LOGIN_EMAIL_MESSAGE =
  'Please enter a valid email address.';

export const loginEmailSchema = z
  .string()
  .trim()
  .email(INVALID_LOGIN_EMAIL_MESSAGE);
