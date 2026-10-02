import { useProcedure } from '@/lib/mrpc/hook';
import login from '../procedures/login';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  facebookLoginFormSchema,
  FacebookLoginFormSchema
} from '../schemas/facebook';
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

export const FacebookConnectForm: React.FC<{
  onConnect: () => void;
  onCancel: () => void;
  redirectTo: string;
  returnTo: string;
}> = ({ onConnect, onCancel, redirectTo, returnTo }) => {
  const facebookForm = useForm<FacebookLoginFormSchema>({
    resolver: zodResolver(facebookLoginFormSchema),
    defaultValues: {
      facebookProfileUrl: ''
    }
  });

  const loginProcedure = useProcedure({
    action: login,
    onSuccess: () => {
      onConnect();
      facebookForm.reset();
    }
  });

  const handleFacebookSubmit = (values: FacebookLoginFormSchema) => {
    loginProcedure.run({
      provider: 'FACEBOOK',
      facebookProfileUrl: values.facebookProfileUrl,
      redirectTo,
      revalidate: 'true',
      returnTo
    });
  };

  return (
    <Form {...facebookForm}>
      <form
        onSubmit={facebookForm.handleSubmit(handleFacebookSubmit)}
        className="space-y-3 pt-2"
      >
        <FormField
          control={facebookForm.control}
          name="facebookProfileUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Facebook Profile URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://facebook.com/username"
                  autoFocus
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter your Facebook profile URL (e.g.,
                https://facebook.com/username)
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
              facebookForm.reset();
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};
