import '@/app/globals.css';
import figtree from '@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2?url';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

const style = document.createElement('style');
style.textContent = `
  @font-face {
    font-family: Figtree;
    font-style: normal;
    font-weight: 300 900;
    font-display: block;
    src: url(${figtree}) format('woff2-variations');
  }
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  html, body {
    margin: 0;
    padding: 0;
  }
`;
document.head.appendChild(style);

beforeAll(async () => {
  await document.fonts.load('400 16px Figtree');
  await document.fonts.load('700 16px Figtree');
});

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove('light', 'dark');
});
