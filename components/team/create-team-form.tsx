'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, AlertTriangle, ArrowLeft } from 'lucide-react';
import { EmojiPickerComponent } from '@/components/patterns/emoji-picker';
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
import createTeam from '@/procedures/teams/create-team';
import { createTeamInputSchema, type CreateTeamInput } from '@/schemas/teams';
import { toast } from 'sonner';
import { useProcedure } from '@/lib/mrpc/hook';
import { LoadingState } from './loading-state';
import { useTeamsPage } from './use-teams-page';
import { useTeamPage } from './use-team-page';

export const CreateTeamForm: React.FC = () => {
  const { navigateToSelect } = useTeamsPage();
  const { navigateToTeam } = useTeamPage();

  const procedure = useProcedure({
    action: createTeam,
    onSuccess(team) {
      toast.success(`Team created: ${team.slug}`);
      navigateToTeam(team);
    },
    onFailure(data) {
      toast.error(data.message);

      if (data.code === 'CONFLICT') {
        form.setError('slug', {
          type: 'manual',
          message: data.message
        });
      }
    }
  });

  const form = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamInputSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      slug: '',
      logo: ''
    }
  });

  const handleBack = () => {
    navigateToSelect();
    form.reset();
  };

  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleEmojiSelect = (emoji: string) => {
    form.setValue('logo', emoji);
  };

  if (procedure.isLoading) return <LoadingState text="Creating your team..." />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(procedure.run)} className="grid gap-4">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Warning:</strong> The team slug cannot be changed after
            creation. Choose wisely!
          </AlertDescription>
        </Alert>

        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="My Awesome Team"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      const slug = generateSlugFromName(e.target.value);
                      form.setValue('slug', slug);
                    }}
                  />
                </FormControl>
                <FormDescription>What others will see.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Slug</FormLabel>
                <FormControl>
                  <Input
                    placeholder="my-awesome-team"
                    {...field}
                    onChange={(e) => {
                      const slug = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '')
                        .replace(/-+/g, '-');
                      field.onChange(slug);
                    }}
                  />
                </FormControl>
                <FormDescription>giveaway.dog/{field.value}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="logo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Logo (Optional)</FormLabel>
                <FormControl>
                  <EmojiPickerComponent
                    value={field.value || '🐶'}
                    onEmojiSelect={handleEmojiSelect}
                    title="Choose an emoji for your team"
                    description="Click the button to pick an emoji that represents your team"
                  />
                </FormControl>
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
            disabled={procedure.isLoading || !form.formState.isValid}
            className="w-full"
          >
            <Building className="mr-2 h-4 w-4" />
            Create Team
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
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
