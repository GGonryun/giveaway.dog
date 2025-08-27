export type UserSection = 'overview' | 'settings';

const USER_SECTIONS: Record<UserSection, boolean> = {
  overview: true,
  settings: true
};
export const sections = Object.keys(USER_SECTIONS) as UserSection[];

export const isUserSection = (s: string): s is UserSection => {
  return sections.includes(s as UserSection);
};
