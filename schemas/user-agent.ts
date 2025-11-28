import { ApplicationError } from '@/lib/errors';
import { UNKNOWN_BROWSER, UNKNOWN_OS } from '@/lib/settings';
import { Prisma } from '@prisma/client';
import { Eye, LucideIcon, Monitor, Smartphone, Tablet } from 'lucide-react';
import { z } from 'zod';

export const deviceTypeSchema = z.enum([
  'mobile',
  'tablet',
  'desktop',
  'unknown'
]);

export type DeviceTypeSchema = z.infer<typeof deviceTypeSchema>;

export const userAgentSchema = z.object({
  agent: z.string(),
  device: deviceTypeSchema,
  os: z.string(),
  browser: z.string()
});

export type UserAgentSchema = z.infer<typeof userAgentSchema>;

export const USER_AGENT_DEVICE_LABEL: Record<DeviceTypeSchema, string> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  desktop: 'Desktop',
  unknown: 'Unknown'
};

export const USER_AGENT_DEVICE_ICON: Record<DeviceTypeSchema, LucideIcon> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  unknown: Eye
};

export const userDeviceActivitySchema = userAgentSchema.extend({
  count: z.number(),
  lastUsed: z.date()
});

export type UserDeviceActivitySchema = z.infer<typeof userDeviceActivitySchema>;

export const INCLUDE_USER_DEVICE_AGENT_QUERY = {
  agent: true
} satisfies Prisma.UserAgentInclude;

export const toUserDeviceActivity = (
  data: Prisma.UserAgentGetPayload<{
    include: typeof INCLUDE_USER_DEVICE_AGENT_QUERY;
  }>
): UserDeviceActivitySchema => {
  const device = deviceTypeSchema.safeParse(data.agent.device);
  if (!device.success) {
    return {
      agent: data.agent.agent,
      device: 'unknown',
      os: data.agent.os ?? UNKNOWN_OS,
      browser: data.agent.browser ?? UNKNOWN_BROWSER,
      count: data.count,
      lastUsed: data.updatedAt
    };
  }

  return {
    agent: data.agent.agent,
    device: device.data,
    os: data.agent.os ?? UNKNOWN_OS,
    browser: data.agent.browser ?? UNKNOWN_BROWSER,
    count: data.count,
    lastUsed: data.updatedAt
  };
};
