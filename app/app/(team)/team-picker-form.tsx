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
import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthFooter } from '@/components/auth/auth-footer';
import { Plus, Building, AlertTriangle, Upload, ArrowLeft, Smile } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import EmojiPicker from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import getUserTeams, { type Team } from '@/actions/teams/get-user-teams';
import selectTeam from '@/actions/teams/select-team';
import createTeam from '@/actions/teams/create-team';


export function TeamPickerForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    slug: '',
    logo: ''
  });

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const userTeams = await getUserTeams();
        setTeams(userTeams);
      } catch (error) {
        console.error('Failed to load teams:', error);
      }
    };
    
    loadTeams();
  }, []);

  const handleSelectTeam = async (teamId: string) => {
    setIsLoading(true);
    try {
      await selectTeam(teamId);
    } catch (error) {
      console.error('Failed to select team:', error);
      setIsLoading(false);
    }
  };

  const handleCreateNewTeam = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setNewTeamData({ name: '', slug: '', logo: '' });
  };

  const handleSlugChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setNewTeamData(prev => ({ ...prev, slug }));
  };

  const handleCreateTeam = async () => {
    setIsLoading(true);
    try {
      await createTeam(newTeamData);
    } catch (error) {
      console.error('Failed to create team:', error);
      setIsLoading(false);
    }
  };

  const handleEmojiSelect = (emojiData: any) => {
    setNewTeamData(prev => ({ ...prev, logo: emojiData.emoji }));
    setShowEmojiPicker(false);
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center mb-4">
          <CardTitle className="text-xl">Choose Your Team</CardTitle>
          <CardDescription>
            {step === 1 ? 'Select from your teams or create a new one' : 'Create your new team'}
          </CardDescription>
        </CardHeader>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner size="xl" className="mb-4" />
            <p className="text-sm text-muted-foreground">
              {step === 2 ? 'Creating your team...' : 'Switching to team...'}
            </p>
          </div>
        ) : (
          <CardContent>
            <div className="grid gap-6">
              {step === 1 && (
                <div className="grid gap-4">
                  <div className="grid gap-3">
                    <Label>Your Teams</Label>
                    <div className="flex flex-col gap-3">
                      {/* Existing Teams */}
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

                  {/* Create New Team Button */}
                  <div className="border-t pt-4">
                    <Button
                      variant="outline"
                      className="w-full p-4 h-auto justify-start hover:bg-muted/50"
                      onClick={handleCreateNewTeam}
                    >
                      <div className="flex items-center space-x-2">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span>Create new team</span>
                      </div>
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="team-name">Team Name</Label>
                      <Input
                        id="team-name"
                        type="text"
                        placeholder="My Awesome Team"
                        value={newTeamData.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setNewTeamData(prev => ({ ...prev, name }));
                          handleSlugChange(name);
                        }}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="team-slug">Team Slug</Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">giveaway.dog/</span>
                        <Input
                          id="team-slug"
                          type="text"
                          placeholder="my-awesome-team"
                          value={newTeamData.slug}
                          onChange={(e) => {
                            const slug = e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, '')
                              .replace(/-+/g, '-');
                            setNewTeamData(prev => ({ ...prev, slug }));
                          }}
                          required
                        />
                      </div>
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          <strong>Warning:</strong> The team slug cannot be changed after creation.
                        </AlertDescription>
                      </Alert>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="team-logo">Team Logo (Optional)</Label>
                      <div className="flex items-center space-x-3">
                        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-12 h-12 p-0 border-2 border-dashed border-muted-foreground/25"
                            >
                              {newTeamData.logo ? (
                                <span className="text-xl">{newTeamData.logo}</span>
                              ) : (
                                <Smile className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <EmojiPicker
                              onEmojiClick={handleEmojiSelect}
                              autoFocusSearch={false}
                              searchDisabled
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="flex-1">
                          <div className="text-sm font-medium">Choose an emoji for your team</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Click the button to pick an emoji that represents your team
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Button
                      type="button"
                      onClick={handleCreateTeam}
                      disabled={!newTeamData.name.trim() || !newTeamData.slug.trim()}
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
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
      <AuthFooter />
    </div>
  );
}