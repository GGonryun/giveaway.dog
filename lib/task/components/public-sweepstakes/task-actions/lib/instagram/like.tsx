import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import { useState, useEffect } from 'react';
import { InstagramLikeTaskSchema } from '@/lib/task/schemas';
import { SocialInstagramIcon } from '@/lib/integrations/components/icons/instagram';
import { cn } from '@/lib/utils';
import { useTaskTheme } from '@/lib/task/components/theme';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { InstagramDisclaimer } from './disclaimer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  INSTAGRAM_USERNAME_QUESTION,
  INSTAGRAM_USERNAME_STORAGE_KEY
} from './constants';

export const InstagramLikeTaskActionForm: React.FC<
  TaskActionProps<InstagramLikeTaskSchema>
> = ({ onSubmit, onUpdate, onCancel, task, submission, isLoading }) => {
  const [userInteracted, setUserInteracted] = useState(false);
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const { theme } = useTaskTheme();

  useEffect(() => {
    const savedUsername = localStorage.getItem(INSTAGRAM_USERNAME_STORAGE_KEY);
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const handleSubmit = () => {
    if (username.trim()) {
      localStorage.setItem(INSTAGRAM_USERNAME_STORAGE_KEY, username.trim());
    }
    onSubmit({ username: username.trim() });
    setUserInteracted(false);
  };

  const handleVisit = () => {
    setUserInteracted(true);
  };

  const handleCancel = () => {
    setUserInteracted(false);
    onCancel();
  };

  useEffect(() => {
    if (submission?.proof && typeof submission.proof === 'object' && 'username' in submission.proof) {
      const submittedUsername = submission.proof.username as string;
      setUsername(submittedUsername);
      setOriginalUsername(submittedUsername);
      setUserInteracted(true);
    }
  }, [submission]);

  const handleUpdate = () => {
    if (username.trim()) {
      localStorage.setItem(INSTAGRAM_USERNAME_STORAGE_KEY, username.trim());
    }
    onUpdate({ username: username.trim() });
  };

  const hasUsernameChanged = submission && username !== originalUsername;

  const canSubmit = submission
    ? hasUsernameChanged && username.trim().length > 0
    : userInteracted && username.trim().length > 0;

  return (
    <>
      <TaskContent>
        <div className="flex flex-col items-center justify-center gap-4">
          <Button
            className={cn(theme.action)}
            asChild
            onClick={handleVisit}
          >
            <Link href={task.postUrl} target="_blank">
              <SocialInstagramIcon />
              View Post on Instagram
            </Link>
          </Button>
          {userInteracted && (
            <div className="space-y-2 mt-2 flex flex-col items-center w-full">
              <Label htmlFor="instagram-username">
                {INSTAGRAM_USERNAME_QUESTION}
              </Label>
              <Input
                id="instagram-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="https://instagram.com/yourprofile"
                disabled={isLoading}
              />
            </div>
          )}
          <Separator />
          <InstagramDisclaimer />
        </div>
      </TaskContent>
      <TaskControls
        disabled={!canSubmit}
        submission={submission}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onUpdate={handleUpdate}
      />
    </>
  );
};
