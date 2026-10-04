import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormDescription
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';
import { SwitchFormHeader } from '@/components/patterns/form-layout/switch-form-header';
import { useParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTwitchTriggerValidation } from '@/lib/task/hooks/use-twitch-trigger-validation';
import Link from 'next/link';
import { useTeams } from '@/components/context/team-provider';

export const TwitchChatImportFormField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  const params = useParams();
  const { activeTeam } = useTeams();
  const sweepstakesId = params.id as string | undefined;

  const trigger = useWatch({
    control: form.control,
    name: `tasks.${index}.trigger`
  });

  const taskId = useWatch({
    control: form.control,
    name: `tasks.${index}.id`
  });

  const taskErrors = form.formState.errors?.tasks?.[index];
  const fieldError =
    taskErrors && 'trigger' in taskErrors ? taskErrors.trigger : undefined;

  const { status, conflict } = useTwitchTriggerValidation({
    trigger,
    sweepstakesId,
    taskId,
    teamId: activeTeam.id,
    debounceMs: 500,
    skipValidation: !!fieldError
  });

  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.trigger`}
      render={({ field }) => (
        <FormItem>
          <SwitchFormHeader
            className="mb-1"
            label="Chat Command"
            help={{
              title: 'Help: Chat Command',
              content: (
                <p>
                  The command viewers will type in chat (e.g.,{' '}
                  <code>!giveaway</code>, <code>!enter</code>,{' '}
                  <code>!join</code>). The command must start with{' '}
                  <code>!</code> and contain only letters, numbers, and
                  underscores.
                </p>
              )
            }}
          />
          <FormControl>
            <Input type="text" placeholder="!giveaway" {...field} />
          </FormControl>
          {status === 'checking' && (
            <FormDescription className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Checking command availability...
            </FormDescription>
          )}
          {status === 'available' && trigger && (
            <FormDescription className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Command is available
            </FormDescription>
          )}
          {status === 'conflict' && conflict && (
            <FormDescription className="flex items-center gap-1.5 text-amber-600">
              <AlertCircle className="h-3 w-3" />
              This command is already used in{' '}
              <Link
                href={`/app/${params.slug}/sweepstakes/${conflict.sweepstakesId}`}
                target="_blank"
                className="underline font-medium"
              >
                {conflict.sweepstakesName}
              </Link>
              . Please use a different command.
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
