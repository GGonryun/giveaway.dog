import { useProcedure } from '@/lib/mrpc/hook';
import login from '../procedures/login';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  instagramLoginFormSchema,
  InstagramLoginFormSchema
} from '@giveaway/meta-model/instagram';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export const InstagramConnectForm: React.FC<{
  onConnect: () => void;
  onCancel: () => void;
  redirectTo: string;
  returnTo: string;
}> = ({ onConnect, onCancel, redirectTo, returnTo }) => {
  const instagramForm = useForm<InstagramLoginFormSchema>({
    resolver: zodResolver(instagramLoginFormSchema),
    defaultValues: {
      instagramProfileUrl: ''
    }
  });

  const loginProcedure = useProcedure({
    action: login,
    onSuccess: () => {
      onConnect();
      instagramForm.reset();
    }
  });

  const handleInstagramSubmit = (values: InstagramLoginFormSchema) => {
    loginProcedure.run({
      provider: 'INSTAGRAM',
      instagramProfileUrl: values.instagramProfileUrl,
      redirectTo,
      revalidate: 'true',
      returnTo
    });
  };

  return (
    <Form {...instagramForm}>
      <form
        onSubmit={instagramForm.handleSubmit(handleInstagramSubmit)}
        className="space-y-3 pt-2"
      >
        <FormField
          control={instagramForm.control}
          name="instagramProfileUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instagram Profile URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://instagram.com/username"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter your Instagram profile URL (e.g.,
                https://instagram.com/username)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={loginProcedure.isLoading}>
            {loginProcedure.isLoading ? <Spinner size="xs" /> : 'Connect'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              onCancel();
              instagramForm.reset();
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};
