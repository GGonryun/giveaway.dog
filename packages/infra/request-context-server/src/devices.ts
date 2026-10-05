import 'server-only';

import {
  UserAgentSchema,
  DeviceTypeSchema
} from '@giveaway/request-context-model/user-agent';
import { UserEvent } from '@giveaway/db-model';
import {
  UNKNOWN_ACCEPTED_LANGUAGE as UNKNOWN_ACCEPT_LANGUAGE,
  UNKNOWN_BROWSER,
  UNKNOWN_IP,
  UNKNOWN_OS,
  UNKNOWN_SCREEN,
  UNKNOWN_TIMEZONE,
  UNKNOWN_USER_AGENT
} from '@giveaway/app-config/settings';
import { ip } from './ip';

export namespace userAgent {
  export const parse = (agent: string | undefined | null): UserAgentSchema => {
    let device: DeviceTypeSchema = 'desktop';
    let os = UNKNOWN_OS;
    let browser = UNKNOWN_BROWSER;

    // Handle undefined or null userAgent
    if (!agent) {
      return { agent: UNKNOWN_USER_AGENT, device: device, os, browser };
    }

    // Detect device type and OS
    if (agent.includes('iPhone')) {
      device = 'mobile';
      const iosMatch = agent.match(/OS (\d+)_(\d+)/);
      os = iosMatch ? `iOS ${iosMatch[1]}.${iosMatch[2]}` : 'iOS';
    } else if (agent.includes('iPad')) {
      device = 'tablet';
      const iosMatch = agent.match(/OS (\d+)_(\d+)/);
      os = iosMatch ? `iPadOS ${iosMatch[1]}.${iosMatch[2]}` : 'iPadOS';
    } else if (agent.includes('Android')) {
      device = agent.includes('Mobile') ? 'mobile' : 'tablet';
      const androidMatch = agent.match(/Android (\d+\.?\d*)/);
      os = androidMatch ? `Android ${androidMatch[1]}` : 'Android';
    } else if (agent.includes('Windows')) {
      device = 'desktop';
      if (agent.includes('Windows NT 10.0')) os = 'Windows 10/11';
      else if (agent.includes('Windows NT 6.3')) os = 'Windows 8.1';
      else if (agent.includes('Windows NT 6.1')) os = 'Windows 7';
      else os = 'Windows';
    } else if (agent.includes('Mac OS X')) {
      device = 'desktop';
      const macMatch = agent.match(/Mac OS X (\d+)_(\d+)/);
      os = macMatch ? `macOS ${macMatch[1]}.${macMatch[2]}` : 'macOS';
    } else if (agent.includes('Linux')) {
      device = 'desktop';
      os = 'Linux';
    }

    // Detect browser
    if (agent.includes('Chrome') && !agent.includes('Chromium')) {
      const chromeMatch = agent.match(/Chrome\/(\d+)/);
      browser = chromeMatch ? `Chrome ${chromeMatch[1]}` : 'Chrome';
    } else if (agent.includes('Firefox')) {
      const firefoxMatch = agent.match(/Firefox\/(\d+)/);
      browser = firefoxMatch ? `Firefox ${firefoxMatch[1]}` : 'Firefox';
    } else if (agent.includes('Safari') && !agent.includes('Chrome')) {
      const safariMatch = agent.match(/Version\/(\d+)/);
      browser = safariMatch ? `Safari ${safariMatch[1]}` : 'Safari';
    } else if (agent.includes('Edge')) {
      const edgeMatch = agent.match(/Edge\/(\d+)/);
      browser = edgeMatch ? `Edge ${edgeMatch[1]}` : 'Edge';
    }

    return { agent, device, os, browser };
  };
}

export namespace devices {
  type UserFingerprintArgs = Pick<
    UserEvent,
    'acceptLanguage' | 'screen' | 'timeZone' | 'userAgent' | 'geo'
  >;

  export const toFingerprint = (args: UserFingerprintArgs): string => {
    const geo = ip.parseGeo(args.geo);
    const parsedUserAgent = userAgent.parse(args.userAgent);

    const components = [
      parsedUserAgent.device,
      parsedUserAgent.os,
      parsedUserAgent.browser,
      args.acceptLanguage || UNKNOWN_ACCEPT_LANGUAGE,
      geo?.ip || UNKNOWN_IP,
      args.timeZone || UNKNOWN_TIMEZONE,
      args.screen || UNKNOWN_SCREEN
    ];
    return `${components.join('|')}`;
  };
}
