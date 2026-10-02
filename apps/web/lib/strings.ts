export namespace strings {
  export const replace = (
    target: string,
    value: string | number,
    replacement: string | number
  ): string => {
    const escapedValue = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex chars
    const pattern = new RegExp(escapedValue, 'g');
    return target.replace(pattern, String(replacement));
  };

  export const obfuscate = (
    email: string | null | undefined
  ): string | null => {
    if (!email) return null;
    const [localPart, domain] = email.split('@');
    if (!domain) return null;
    const obfuscatedLocal = localPart[0] + '***' + localPart.slice(-1);
    return `${obfuscatedLocal}@${domain}`;
  };
}
