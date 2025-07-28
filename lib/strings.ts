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
}
