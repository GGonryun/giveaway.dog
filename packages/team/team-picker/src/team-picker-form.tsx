'use client';

import { cn } from '@giveaway/ui-utils/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@giveaway/ui-primitives/card';
import { AuthFooter } from '@giveaway/auth-login-ui/auth-footer';
import { SelectTeamForm } from './select-team-form';
import { CreateTeamForm } from './create-team-form';
import { useTeamsPage } from '@giveaway/team-context/use-teams-page';

export function TeamPickerForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { step } = useTeamsPage();

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center mb-4">
          <CardTitle className="text-xl">Choose Your Team</CardTitle>
          <CardDescription>
            {step === 2
              ? 'Create your new team'
              : 'Select from your teams or create a new one'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6">
            {step === 2 ? <CreateTeamForm /> : <SelectTeamForm />}
          </div>
        </CardContent>
      </Card>
      <AuthFooter />
    </div>
  );
}
