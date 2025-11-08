export const toProviderUrl = (integration: {
  provider: string;
  label: string | null;
}) => {
  switch (integration.provider) {
    case 'TWITTER':
      return integration.label ? `https://x.com/${integration.label}` : null;
    default:
      return null;
  }
};
