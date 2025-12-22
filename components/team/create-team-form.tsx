'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, AlertTriangle, ArrowLeft, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { FileUpload } from '@/components/ui/file-upload';
import { HelpDialog } from '@/components/patterns/help-dialog';
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
      logo: undefined
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

  if (procedure.isLoading) return <LoadingState text="Creating your team..." />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(procedure.run)} className="grid gap-4">
        <Alert variant="warning">
          <AlertTriangle />
          <AlertDescription>
            <strong>Warning:</strong> The team slug cannot be changed after
            creation. Choose wisely!
          </AlertDescription>
        </Alert>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="link"
              className="w-fit p-0 h-auto text-sm text-muted-foreground hover:text-primary"
            >
              <Info className="h-4 w-4 mr-1" />
              What are teams?
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>What are Teams?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Teams help users manage an organization or a group of users who
                can collaboratively manage giveaways together.
              </p>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">
                  Common Use Cases:
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>Brands and Organizations:</strong> Allow multiple
                    team members or moderators to create and manage giveaways
                    without sharing personal login credentials.
                  </li>
                  <li>
                    <strong>Collaborative Management:</strong> Multiple users
                    can work together on the same giveaways, making it easier to
                    coordinate marketing campaigns.
                  </li>
                  <li>
                    <strong>Support Access:</strong> Grant giveaway.dog support
                    agents temporary access to provide real-time white-glove
                    services or assistance with setting up your giveaways.
                  </li>
                </ul>
              </div>
              <p>
                With teams, you maintain control over who has access while
                enabling seamless collaboration and professional support when
                needed.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <div className="flex gap-1 items-center">
                  <FormLabel>Team Name</FormLabel>
                  <HelpDialog
                    title="Help: Team Name"
                    content={
                      <p>
                        The team name is the display name that will be shown to
                        others. This can be your brand name, organization name,
                        or any name that represents your team. You can change
                        this later.
                      </p>
                    }
                  />
                </div>
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
                <div className="flex gap-1 items-center">
                  <FormLabel>Team Slug</FormLabel>
                  <HelpDialog
                    title="Help: Team Slug"
                    content={
                      <div className="space-y-2">
                        <p>
                          The team slug is a unique identifier used in your
                          team's URL (giveaway.dog/your-slug). It can only
                          contain lowercase letters, numbers, and hyphens.
                        </p>
                        <p className="font-semibold text-amber-600">
                          ⚠️ Warning: The slug cannot be changed after creation,
                          so choose carefully!
                        </p>
                      </div>
                    }
                  />
                </div>
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
                <div className="flex gap-1 items-center">
                  <FormLabel>Team Logo (Optional)</FormLabel>
                  <HelpDialog
                    title="Help: Team Logo"
                    content={
                      <p>
                        Upload a logo that represents your team or brand. This
                        will be displayed on your team's profile and can help
                        users identify your giveaways. You can change or update
                        this logo at any time.
                      </p>
                    }
                  />
                </div>
                <FormControl>
                  <FileUpload
                    initialUrl={field.value}
                    onUpload={(url) => field.onChange(url)}
                    size="md"
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
