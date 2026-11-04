export type KnownViolation = {
  rule: string;
  selector: string;
  issue: number;
};

export const KNOWN_VIOLATIONS: KnownViolation[] = [
  {
    rule: 'aria-allowed-attr',
    selector: 'div[data-slot="dialog-trigger"]',
    issue: 543
  },
  { rule: 'button-name', selector: 'button:has(> svg:only-child)', issue: 100 }
];
