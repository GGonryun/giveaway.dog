import { cookies } from 'next/headers';
import { THEME_STORAGE_KEY } from './constants';

type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export async function getServerTheme(): Promise<ResolvedTheme> {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_STORAGE_KEY);

  const theme = themeCookie?.value as Theme | undefined;

  if (!theme || theme === 'system') {
    return 'dark';
  }

  return theme as ResolvedTheme;
}
