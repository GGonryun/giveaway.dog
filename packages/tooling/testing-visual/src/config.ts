import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/postcss';
import { playwright } from '@vitest/browser-playwright';
import type { ViteUserConfig } from 'vitest/config';

const APP_ROOT = fileURLToPath(
  new URL('../../../../apps/web/', import.meta.url)
);

const THEME = `${APP_ROOT}app/globals.css`;

export const visualTestConfig = (): ViteUserConfig => ({
  css: {
    postcss: {
      plugins: [tailwindcss({ base: APP_ROOT })]
    }
  },
  optimizeDeps: {
    entries: ['**/*.visual.test.tsx'],
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-dev-runtime',
      '@testing-library/react'
    ],
    esbuildOptions: {
      define: {
        __dirname: '"/"'
      }
    }
  },
  test: {
    name: 'visual',
    include: ['**/*.visual.test.tsx'],
    exclude: ['**/node_modules/**', '.next/**'],
    setupFiles: [THEME, '@giveaway/testing-visual/setup'],
    attachmentsDir: '.vitest-attachments',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        launchOptions: {
          executablePath: process.env.VISUAL_CHROMIUM_PATH || undefined
        },
        contextOptions: {
          deviceScaleFactor: 1,
          reducedMotion: 'reduce',
          colorScheme: 'light',
          locale: 'en-US',
          timezoneId: 'UTC'
        }
      }),
      instances: [{ browser: 'chromium' }],
      viewport: { width: 1280, height: 800 },
      screenshotFailures: false,
      expect: {
        toMatchScreenshot: {
          comparatorName: 'pixelmatch',
          comparatorOptions: {
            threshold: 0.1,
            allowedMismatchedPixels: 0
          }
        }
      }
    }
  }
});
