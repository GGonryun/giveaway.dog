export const toJsonObject = (value: unknown): Record<string, any> => {
  if (!value) {
    return {};
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }

  return {};
};
