import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { userAgent, devices } from '../devices';
import { DEVELOPMENT_GEO } from '@giveaway/request-context-model/fingerprint';

const UA = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1',
  ipadChrome:
    'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/114.0.5735.124 Mobile/15E148 Safari/604.1',
  androidPhoneChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
  androidTabletChrome:
    'Mozilla/5.0 (Linux; Android 13.1; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  androidFirefox:
    'Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0',
  windows10Chrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  windows81Firefox:
    'Mozilla/5.0 (Windows NT 6.3; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
  windows7Firefox:
    'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0',
  windowsXp: 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; Trident/4.0)',
  legacyEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19582',
  modernEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  macFirefox:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  linuxChrome:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  linuxChromium:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chromium/120.0.0.0 Chrome/120.0.0.0 Safari/537.36'
};

describe('userAgent.parse', () => {
  describe('when the agent is missing', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['an empty string', '']
    ])('returns unknown defaults for %s', (_label, value) => {
      expect(userAgent.parse(value)).toEqual({
        agent: 'unknown',
        device: 'desktop',
        os: 'Unknown OS',
        browser: 'Unknown Browser'
      });
    });
  });

  describe('when detecting the device and operating system', () => {
    it('detects an iPhone with its iOS version', () => {
      expect(userAgent.parse(UA.iphoneSafari)).toEqual({
        agent: UA.iphoneSafari,
        device: 'mobile',
        os: 'iOS 17.1',
        browser: 'Safari 17'
      });
    });

    it('falls back to a bare iOS label when the iPhone version is missing', () => {
      expect(userAgent.parse('iPhone')).toMatchObject({
        device: 'mobile',
        os: 'iOS'
      });
    });

    it('detects an iPad with its iPadOS version', () => {
      expect(userAgent.parse(UA.ipadChrome)).toMatchObject({
        device: 'tablet',
        os: 'iPadOS 16.5'
      });
    });

    it('falls back to a bare iPadOS label when the iPad version is missing', () => {
      expect(userAgent.parse('iPad')).toMatchObject({
        device: 'tablet',
        os: 'iPadOS'
      });
    });

    it('treats an Android agent containing Mobile as a mobile device', () => {
      expect(userAgent.parse(UA.androidPhoneChrome)).toMatchObject({
        device: 'mobile',
        os: 'Android 14'
      });
    });

    it('treats an Android agent without Mobile as a tablet', () => {
      expect(userAgent.parse(UA.androidTabletChrome)).toMatchObject({
        device: 'tablet',
        os: 'Android 13.1'
      });
    });

    it('keeps only the major and first minor Android version digits', () => {
      expect(userAgent.parse('Android 10.0.1; Mobile').os).toBe('Android 10.0');
    });

    it('falls back to a bare Android label when the version is missing', () => {
      expect(userAgent.parse('Android')).toMatchObject({
        device: 'tablet',
        os: 'Android'
      });
    });

    it('detects Windows NT 10.0 as Windows 10/11', () => {
      expect(userAgent.parse(UA.windows10Chrome)).toMatchObject({
        device: 'desktop',
        os: 'Windows 10/11'
      });
    });

    it('detects Windows NT 6.3 as Windows 8.1', () => {
      expect(userAgent.parse(UA.windows81Firefox).os).toBe('Windows 8.1');
    });

    it('detects Windows NT 6.1 as Windows 7', () => {
      expect(userAgent.parse(UA.windows7Firefox).os).toBe('Windows 7');
    });

    it('labels other Windows versions as Windows', () => {
      expect(userAgent.parse(UA.windowsXp)).toEqual({
        agent: UA.windowsXp,
        device: 'desktop',
        os: 'Windows',
        browser: 'Unknown Browser'
      });
    });

    it('detects macOS with an underscore separated version', () => {
      expect(userAgent.parse(UA.macSafari)).toEqual({
        agent: UA.macSafari,
        device: 'desktop',
        os: 'macOS 10.15',
        browser: 'Safari 17'
      });
    });

    it('falls back to a bare macOS label for a dot separated version', () => {
      expect(userAgent.parse(UA.macFirefox)).toMatchObject({
        device: 'desktop',
        os: 'macOS',
        browser: 'Firefox 121'
      });
    });

    it('detects Linux', () => {
      expect(userAgent.parse(UA.linuxChrome)).toEqual({
        agent: UA.linuxChrome,
        device: 'desktop',
        os: 'Linux',
        browser: 'Chrome 120'
      });
    });

    it('keeps the desktop default and unknown OS for unrecognized agents', () => {
      expect(userAgent.parse('curl/8.4.0')).toEqual({
        agent: 'curl/8.4.0',
        device: 'desktop',
        os: 'Unknown OS',
        browser: 'Unknown Browser'
      });
    });
  });

  describe('when detecting the browser', () => {
    it('detects Chrome with its major version', () => {
      expect(userAgent.parse(UA.androidPhoneChrome).browser).toBe('Chrome 120');
    });

    it('falls back to a bare Chrome label when the version is missing', () => {
      expect(userAgent.parse('Chrome').browser).toBe('Chrome');
    });

    it('detects Firefox with its major version', () => {
      expect(userAgent.parse(UA.androidFirefox)).toMatchObject({
        device: 'mobile',
        os: 'Android 14',
        browser: 'Firefox 121'
      });
    });

    it('falls back to a bare Firefox label when the version is missing', () => {
      expect(userAgent.parse('Firefox').browser).toBe('Firefox');
    });

    it('detects Safari from the Version token', () => {
      expect(userAgent.parse(UA.iphoneSafari).browser).toBe('Safari 17');
    });

    it('falls back to a bare Safari label when no Version token exists', () => {
      expect(userAgent.parse(UA.ipadChrome).browser).toBe('Safari');
    });

    it('detects a standalone Edge token with its version', () => {
      expect(userAgent.parse('Mozilla/5.0 Edge/15.15063')).toEqual({
        agent: 'Mozilla/5.0 Edge/15.15063',
        device: 'desktop',
        os: 'Unknown OS',
        browser: 'Edge 15'
      });
    });

    it('falls back to a bare Edge label when the version is missing', () => {
      expect(userAgent.parse('Edge').browser).toBe('Edge');
    });

    it('reports legacy Edge agents that include Chrome as Chrome', () => {
      expect(userAgent.parse(UA.legacyEdge).browser).toBe('Chrome 70');
    });

    it('reports modern Edg agents as Chrome', () => {
      expect(userAgent.parse(UA.modernEdge).browser).toBe('Chrome 120');
    });

    it('reports Chromium agents as an unknown browser', () => {
      expect(userAgent.parse(UA.linuxChromium)).toMatchObject({
        os: 'Linux',
        browser: 'Unknown Browser'
      });
    });
  });
});

describe('devices.toFingerprint', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('joins the parsed agent, language, ip, time zone and screen with pipes', () => {
    const fingerprint = devices.toFingerprint({
      userAgent: UA.iphoneSafari,
      acceptLanguage: 'en-US',
      geo: { ...DEVELOPMENT_GEO, ip: '203.0.113.7' },
      timeZone: 'America/New_York',
      screen: '390x844'
    });

    expect(fingerprint).toBe(
      'mobile|iOS 17.1|Safari 17|en-US|203.0.113.7|America/New_York|390x844'
    );
  });

  it('does not warn when the stored geo data is valid', () => {
    devices.toFingerprint({
      userAgent: UA.iphoneSafari,
      acceptLanguage: 'en-US',
      geo: DEVELOPMENT_GEO,
      timeZone: 'UTC',
      screen: '1x1'
    });

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('uses unknown defaults for every missing field', () => {
    const fingerprint = devices.toFingerprint({
      userAgent: null,
      acceptLanguage: null,
      geo: null,
      timeZone: null,
      screen: null
    });

    expect(fingerprint).toBe(
      'desktop|Unknown OS|Unknown Browser|en|::1|UTC|0x0'
    );
  });

  it('uses unknown defaults for empty strings', () => {
    const fingerprint = devices.toFingerprint({
      userAgent: '',
      acceptLanguage: '',
      geo: { ...DEVELOPMENT_GEO, ip: '' },
      timeZone: '',
      screen: ''
    });

    expect(fingerprint).toBe(
      'desktop|Unknown OS|Unknown Browser|en|::1|UTC|0x0'
    );
  });

  it('falls back to the unknown ip and warns when the geo data is invalid', () => {
    const fingerprint = devices.toFingerprint({
      userAgent: UA.linuxChrome,
      acceptLanguage: 'fr-FR',
      geo: { ip: '198.51.100.1' },
      timeZone: 'Europe/Paris',
      screen: '1920x1080'
    });

    expect(fingerprint).toBe(
      'desktop|Linux|Chrome 120|fr-FR|::1|Europe/Paris|1920x1080'
    );
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to parse stored IP geo data',
      expect.anything()
    );
  });
});
