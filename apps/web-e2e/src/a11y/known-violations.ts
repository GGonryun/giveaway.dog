export type KnownViolation = {
  rule: string;
  selector: string;
  issue: number;
};

export const KNOWN_VIOLATIONS: KnownViolation[] = [];
