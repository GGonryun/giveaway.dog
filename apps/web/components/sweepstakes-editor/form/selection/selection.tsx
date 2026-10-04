import { UnifiedSectionHeader } from '@giveaway/ui-layouts/form-layout/section-header';
import { WinnerCriteria } from './winner-criteria';

export const Selection = () => (
  <UnifiedSectionHeader
    label="Winner Selection Criteria"
    description="Set requirements for winner eligibility"
  >
    <WinnerCriteria />
  </UnifiedSectionHeader>
);
