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
  { rule: 'button-name', selector: 'button:has(> svg:only-child)', issue: 100 },
  { rule: 'button-name', selector: 'button[role="combobox"]', issue: 542 },
  { rule: 'label', selector: 'textarea', issue: 542 }
];
