import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config'; // Adjust path

const fullConfig = resolveConfig(tailwindConfig);
const purple500 = fullConfig.theme.colors.purple[500];
const cyan400 = fullConfig.theme.colors.cyan[400];
const slate500 = fullConfig.theme.colors.slate[500];

export const swatch = { slate500, purple500, cyan400 };
