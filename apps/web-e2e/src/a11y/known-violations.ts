export type KnownViolation = {
  rule: string;
  selector: string;
  issue: number;
};

export const KNOWN_VIOLATIONS: KnownViolation[] = [
  {
    rule: 'aria-allowed-attr',
    selector: 'div[type="button"][aria-controls]',
    issue: 108
  },
  {
    rule: 'aria-allowed-attr',
    selector: 'div[data-slot="dialog-trigger"]',
    issue: 543
  },
  {
    rule: 'aria-valid-attr-value',
    selector: '[data-slot="tabs-trigger"]',
    issue: 540
  },
  { rule: 'button-name', selector: 'button:has(> svg:only-child)', issue: 100 },
  { rule: 'button-name', selector: 'button[role="combobox"]', issue: 542 },
  { rule: 'label', selector: 'textarea', issue: 542 },
  {
    rule: 'color-contrast',
    selector: '[data-slot="tooltip-trigger"]',
    issue: 541
  },
  { rule: 'color-contrast', selector: 'span.wiggle-timer', issue: 541 },
  { rule: 'color-contrast', selector: '[data-slot="badge"]', issue: 541 },
  {
    rule: 'color-contrast',
    selector: '[data-slot="alert-description"]',
    issue: 541
  },
  {
    rule: 'color-contrast',
    selector: '[data-slot="button"].bg-destructive',
    issue: 541
  }
];
