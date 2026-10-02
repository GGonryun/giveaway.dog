import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  optimizeDeps: {
    entries: ['**/*.visual.test.tsx', 'test/visual/**/*.{ts,tsx}'],
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
    setupFiles: ['./test/visual/setup.ts'],
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
