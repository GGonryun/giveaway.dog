'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, AlertTriangle, ArrowLeft, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
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
import createTeam from '@/actions/teams/create-team';
import { createTeamInputSchema, type CreateTeamInput } from '@/schemas/teams';
import { toast } from 'sonner';
import { useProcedure } from '@/lib/mrpc/hook';
import { LoadingState } from './loading-state';
import { useTeamsPage } from './use-teams-page';
import { useTeamPage } from './use-team-page';

export const CreateTeamForm: React.FC = () => {
  const { navigateToSelect } = useTeamsPage();
  const { navigateToTeam } = useTeamPage();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

  const handleEmojiSelect = (emojiData: any) => {
    form.setValue('logo', emojiData.emoji);
    setShowEmojiPicker(false);
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
                  <div className="flex items-center space-x-3">
                    <Popover
                      open={showEmojiPicker}
                      onOpenChange={setShowEmojiPicker}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-12 h-12 p-0 border-2 border-dashed border-muted-foreground/25"
                        >
                          {field.value ? (
                            <span className="text-3xl">{field.value}</span>
                          ) : (
                            <Smile className="h-8 w-8 text-muted-foreground" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <EmojiPicker
                          onEmojiClick={handleEmojiSelect}
                          autoFocusSearch={false}
                          previewConfig={{
                            showPreview: false
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        Choose an emoji for your team
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click the button to pick an emoji that represents your
                        team
                      </p>
                    </div>
                  </div>
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
