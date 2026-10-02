import { describe, it, expect } from 'vitest';
import { Users } from 'lucide-react';
import {
  DEFAULT_TEAM_LOGO,
  DEFAULT_TEAM_NAME,
  FALLBACK_TEAM_ICON
} from '../data';

describe('team data', () => {
  it('uses the hosted taki image as the default team logo', () => {
    expect(DEFAULT_TEAM_LOGO).toBe(
      'https://a8mwfsrzadqc10xo.public.blob.vercel-storage.com/taki.png'
    );
  });

  it('serves the default team logo over https', () => {
    expect(new URL(DEFAULT_TEAM_LOGO).protocol).toBe('https:');
  });

  it('uses the lucide Users icon as the fallback team icon', () => {
    expect(FALLBACK_TEAM_ICON).toBe(Users);
  });

  it('names the default team Default Team', () => {
    expect(DEFAULT_TEAM_NAME).toBe('Default Team');
  });
});
