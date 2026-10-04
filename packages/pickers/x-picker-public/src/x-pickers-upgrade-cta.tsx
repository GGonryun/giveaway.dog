'use client';

import { Card, CardContent } from '@giveaway/ui-primitives/card';
import { XPickerUpgradeContent } from '@giveaway/picker-ui/components/x-picker-upgrade-content';

interface XPickersUpgradeCTAProps {
  slug: string;
}

export const XPickersUpgradeCTA: React.FC<XPickersUpgradeCTAProps> = ({
  slug
}) => {
  return (
    <div className="my-auto mx-auto flex items-center justify-center">
      <Card className="my-12">
        <CardContent>
          <XPickerUpgradeContent slug={slug} />
        </CardContent>
      </Card>
    </div>
  );
};
