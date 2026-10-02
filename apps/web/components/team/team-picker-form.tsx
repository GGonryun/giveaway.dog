'use client';

import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { AuthFooter } from '@/components/auth/auth-footer';
import { SelectTeamForm } from './select-team-form';
import { CreateTeamForm } from './create-team-form';
import { useTeamsPage } from './use-teams-page';

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
            {step === 1
              ? 'Select from your teams or create a new one'
              : 'Create your new team'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6">
            {!step || (step === 1 && <SelectTeamForm />)}
            {step === 2 && <CreateTeamForm />}
          </div>
        </CardContent>
      </Card>
      <AuthFooter />
    </div>
  );
}
