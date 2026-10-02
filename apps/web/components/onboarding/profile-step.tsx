'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, User, AlertTriangle } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { toast } from 'sonner';
import { useProcedure } from '@/lib/mrpc/hook';
import { LoadingState } from './loading-state';
import { UserAccountType } from '@prisma/client';
import completeOnboarding from '@/procedures/user/complete-onboarding';
import { getUserAuthRedirect } from '@/lib/redirect';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import z from 'zod';

const profileFormSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(15, 'Username must be at most 15 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  image: z.string().url().nullable().optional()
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface ProfileStepProps {
  accountType: UserAccountType;
  onBack: () => void;
}

export const ProfileStep: React.FC<ProfileStepProps> = ({
  accountType,
  onBack
}) => {
  const router = useRouter();
  const { update } = useSession();

  const procedure = useProcedure({
    action: completeOnboarding,
    async onSuccess(data) {
      // Update the session to refresh the JWT with onboarded: true
      // Pass the data to trigger the JWT callback
      await update({
        onboarded: true,
        accountType: data.accountType,
        username: data.username
      });

      toast.success('Welcome to Giveaway.dog!');
      const redirect = getUserAuthRedirect({ accountType });
      router.push(redirect);
    },
    onFailure(data) {
      toast.error(data.message);

      if (data.code === 'CONFLICT') {
        form.setError('username', {
          type: 'manual',
          message: data.message
        });
      }
    }
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    mode: 'onChange',
    defaultValues: {
      username: '',
      image: null
    }
  });

  const handleSubmit = (data: ProfileFormData) => {
    procedure.run({
      username: data.username,
      accountType,
      image: data.image || null
    });
  };

  if (procedure.isLoading || procedure.isSubmitting)
    return <LoadingState text="Setting up your profile..." />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-6">
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="cool_user_123"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, '');
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  3-15 characters. Letters, numbers, and underscores only.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Picture (Optional)</FormLabel>
                <FormControl>
                  <FileUpload
                    initialUrl={field.value || undefined}
                    onUpload={(url) => field.onChange(url)}
                    size="wide"
                    fillPreview
                    className="items-start mt-2"
                  />
                </FormControl>
                <FormDescription>
                  Upload an image file (JPEG, PNG, or GIF) up to 3MB
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.formState.errors.root && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-2">
          <Button
            type="submit"
            disabled={
              procedure.isLoading ||
              procedure.isSubmitting ||
              !form.formState.isValid
            }
            className="w-full"
          >
            <User className="mr-2 h-4 w-4" />
            Complete Setup
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </form>
    </Form>
  );
};
