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
  id: z.string(),
  sessions: z.number(),
  lastUsed: z.date()
});

export type UserDeviceActivitySchema = z.infer<typeof userDeviceActivitySchema>;
