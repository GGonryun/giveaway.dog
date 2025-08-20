'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useCallback } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthFooter } from '@/components/auth/auth-footer';
import { Plus, Building, AlertTriangle, ArrowLeft, Smile } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import getUserTeams from '@/actions/teams/get-user-teams';
import selectTeam from '@/actions/teams/select-team';
import createTeam from '@/actions/teams/create-team';
import {
  DetailedUserTeam,
  createTeamInputSchema,
  type CreateTeamInput,
  detailedUserTeamSchema
} from '@/schemas/teams';
import { toast } from 'sonner';
import { useServerAction } from '@/lib/mrpc/hook';

export function TeamPickerForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [step, setStep] = useState(1);

  const handleSetStep = useCallback(
    (step: number) => () => {
      setStep(step);
    },
    [setStep]
  );

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
            {step === 1 && <SelectTeamForm onCreateTeam={handleSetStep(2)} />}
            {step === 2 && <CreateTeamForm onBack={handleSetStep(1)} />}
          </div>
        </CardContent>
      </Card>
      <AuthFooter />
    </div>
  );
}

const LoadingState: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Spinner size="xl" className="mb-4" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
};

const CreateTeamForm: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [isLoading, handleCreateTeam] = useServerAction({
    action: createTeam,
    onFailure: (data) => {
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
    defaultValues: {
      name: '',
      slug: '',
      logo: ''
    }
  });

  const handleBack = () => {
    onBack();
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

  if (isLoading) return <LoadingState text="Creating your team..." />;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleCreateTeam)}
        className="grid gap-4"
      >
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
            disabled={isLoading || !form.formState.isValid}
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

const SelectTeamForm: React.FC<{
  onCreateTeam: () => void;
}> = ({ onCreateTeam }) => {
  const [teams, setTeams] = useState<DetailedUserTeam[]>([]);

  const [isLoadingSelectTeam, handleSelectTeam] = useServerAction({
    action: selectTeam
  });

  const [, handleGetTeams] = useServerAction({
    action: getUserTeams,
    onSuccess: setTeams
  });

  useEffect(() => {
    handleGetTeams();
  }, []);

  if (isLoadingSelectTeam) return <LoadingState text="Switching to team..." />;

  return (
    <div className="grid gap-4">
      {teams.length > 0 ? (
        <div className="grid gap-3">
          <Label>Your Teams</Label>
          <div className="flex flex-col gap-3">
            {teams.map((team) => (
              <Button
                key={team.id}
                variant="outline"
                className="p-4 h-auto justify-start hover:bg-muted/50"
                onClick={() => handleSelectTeam(team.id)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="text-2xl">{team.logo || '🏢'}</div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{team.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {team.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      @{team.slug} • {team.memberCount} members
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You haven't joined any teams yet. Create your first team to get
            started.
          </p>
        </div>
      )}

      <div className={teams.length > 0 ? 'border-t pt-4' : ''}>
        <Button
          variant={teams.length === 0 ? 'default' : 'outline'}
          className={
            teams.length === 0
              ? 'w-full p-4 h-auto justify-center'
              : 'w-full p-4 h-auto justify-start hover:bg-muted/50'
          }
          onClick={onCreateTeam}
        >
          <div className="flex items-center space-x-2">
            <Plus
              className={
                teams.length === 0 ? 'h-4 w-4' : 'h-4 w-4 text-muted-foreground'
              }
            />
            <span>
              {teams.length === 0
                ? 'Create your first team'
                : 'Create new team'}
            </span>
          </div>
        </Button>
      </div>
    </div>
  );
};
