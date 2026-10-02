import { describe, it, expect } from 'vitest';
import { Eye, Monitor, Smartphone, Tablet } from 'lucide-react';
import {
  deviceTypeSchema,
  userAgentSchema,
  USER_AGENT_DEVICE_LABEL,
  USER_AGENT_DEVICE_ICON,
  userDeviceActivitySchema,
  INCLUDE_USER_DEVICE_AGENT_QUERY,
  toUserDeviceActivity
} from '../user-agent';

type UserAgentRow = Parameters<typeof toUserDeviceActivity>[0];
type DeviceAgentRow = UserAgentRow['agent'];

const LAST_USED = new Date('2026-05-05T05:05:05.000Z');

const row = (agent: Partial<DeviceAgentRow> = {}): UserAgentRow => ({
  id: 'user-agent-1',
  userId: 'user-1',
  agentId: 'agent-1',
  count: 7,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: LAST_USED,
  agent: {
    id: 'agent-1',
    agent: 'Mozilla/5.0 (iPhone)',
    device: 'mobile',
    os: 'iOS',
    browser: 'Safari',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...agent
  }
});

describe('deviceTypeSchema', () => {
  it.each(['mobile', 'tablet', 'desktop', 'unknown'])('accepts %s', (type) => {
    expect(deviceTypeSchema.parse(type)).toBe(type);
  });

  it('rejects other device types', () => {
    expect(deviceTypeSchema.safeParse('watch').success).toBe(false);
  });
});

describe('userAgentSchema', () => {
  it('accepts a full user agent', () => {
    const agent = {
      agent: 'curl/8',
      device: 'desktop',
      os: 'Linux',
      browser: 'curl'
    };

    expect(userAgentSchema.parse(agent)).toEqual(agent);
  });

  it('rejects a null os', () => {
    expect(
      userAgentSchema.safeParse({
        agent: 'curl/8',
        device: 'desktop',
        os: null,
        browser: 'curl'
      }).success
    ).toBe(false);
  });
});

describe('userDeviceActivitySchema', () => {
  it('adds a count and coerced lastUsed date', () => {
    expect(
      userDeviceActivitySchema.parse({
        agent: 'curl/8',
        device: 'unknown',
        os: 'Linux',
        browser: 'curl',
        count: 2,
        lastUsed: '2026-05-05T05:05:05.000Z'
      })
    ).toEqual({
      agent: 'curl/8',
      device: 'unknown',
      os: 'Linux',
      browser: 'curl',
      count: 2,
      lastUsed: LAST_USED
    });
  });

  it('rejects a missing count', () => {
    expect(
      userDeviceActivitySchema.safeParse({
        agent: 'curl/8',
        device: 'unknown',
        os: 'Linux',
        browser: 'curl',
        lastUsed: LAST_USED
      }).success
    ).toBe(false);
  });
});

describe('device display records', () => {
  it('labels every device type', () => {
    expect(USER_AGENT_DEVICE_LABEL).toEqual({
      mobile: 'Mobile',
      tablet: 'Tablet',
      desktop: 'Desktop',
      unknown: 'Unknown'
    });
  });

  it('maps every device type to an icon', () => {
    expect(USER_AGENT_DEVICE_ICON).toEqual({
      mobile: Smartphone,
      tablet: Tablet,
      desktop: Monitor,
      unknown: Eye
    });
  });
});

describe('INCLUDE_USER_DEVICE_AGENT_QUERY', () => {
  it('includes the device agent relation', () => {
    expect(INCLUDE_USER_DEVICE_AGENT_QUERY).toEqual({ agent: true });
  });
});

describe('toUserDeviceActivity', () => {
  it('maps a known device type', () => {
    expect(toUserDeviceActivity(row())).toEqual({
      agent: 'Mozilla/5.0 (iPhone)',
      device: 'mobile',
      os: 'iOS',
      browser: 'Safari',
      count: 7,
      lastUsed: LAST_USED
    });
  });

  it.each(['tablet', 'desktop', 'unknown'])(
    'keeps the %s device type',
    (device) => {
      expect(toUserDeviceActivity(row({ device })).device).toBe(device);
    }
  );

  it.each([null, 'smart-tv', 'Mobile'])(
    "falls back to 'unknown' for the device %j",
    (device) => {
      expect(toUserDeviceActivity(row({ device }))).toEqual({
        agent: 'Mozilla/5.0 (iPhone)',
        device: 'unknown',
        os: 'iOS',
        browser: 'Safari',
        count: 7,
        lastUsed: LAST_USED
      });
    }
  );

  it('uses placeholder names when the os and browser are missing', () => {
    expect(
      toUserDeviceActivity(row({ os: null, browser: null }))
    ).toMatchObject({ os: 'Unknown OS', browser: 'Unknown Browser' });
  });

  it('uses placeholder names for an unknown device with no os or browser', () => {
    expect(
      toUserDeviceActivity(row({ device: null, os: null, browser: null }))
    ).toMatchObject({
      device: 'unknown',
      os: 'Unknown OS',
      browser: 'Unknown Browser'
    });
  });

  it('keeps empty os and browser strings for an unknown device', () => {
    expect(
      toUserDeviceActivity(row({ device: 'smart-tv', os: '', browser: '' }))
    ).toMatchObject({ device: 'unknown', os: '', browser: '' });
  });

  it('keeps empty os and browser strings', () => {
    expect(toUserDeviceActivity(row({ os: '', browser: '' }))).toMatchObject({
      os: '',
      browser: ''
    });
  });

  it('produces output that satisfies userDeviceActivitySchema', () => {
    expect(
      userDeviceActivitySchema.safeParse(toUserDeviceActivity(row())).success
    ).toBe(true);
  });
});
