import { useProcedure } from '@/lib/mrpc/hook';
import login from '../procedures/login';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  blueskyLoginFormSchema,
  BlueskyLoginFormSchema
} from '../schemas/bluesky';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';
import { Button } from '@giveaway/ui-primitives/button';
import { Spinner } from '@giveaway/ui-primitives/spinner';

export const BlueskyConnectForm: React.FC<{
  onConnect: () => void;
  onCancel: () => void;
  redirectTo: string;
  returnTo: string;
}> = ({ onConnect, onCancel, redirectTo, returnTo }) => {
  const blueskyForm = useForm<BlueskyLoginFormSchema>({
    resolver: zodResolver(blueskyLoginFormSchema),
    defaultValues: {
      blueskyHandle: ''
    }
  });

  const loginProcedure = useProcedure({
    action: login,
    onSuccess: () => {
      onConnect();
      blueskyForm.reset();
    }
  });

  const handleBlueskySubmit = (values: BlueskyLoginFormSchema) => {
    loginProcedure.run({
      provider: 'BLUESKY',
      blueskyHandle: values.blueskyHandle,
      redirectTo,
      revalidate: 'true',
      returnTo
    });
  };

  return (
    <Form {...blueskyForm}>
      <form
        onSubmit={blueskyForm.handleSubmit(handleBlueskySubmit)}
        className="space-y-3 pt-2"
      >
        <FormField
          control={blueskyForm.control}
          name="blueskyHandle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bluesky Handle</FormLabel>
              <FormControl>
                <Input
                  placeholder="username.bsky.social"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter your Bluesky handle (e.g., username.bsky.social)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={loginProcedure.isLoading}>
            {loginProcedure.isLoading ? <Spinner size="xs" /> : 'Continue'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              onCancel();
              blueskyForm.reset();
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};
