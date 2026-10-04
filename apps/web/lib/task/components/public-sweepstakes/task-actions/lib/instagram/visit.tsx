import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import { useState, useEffect } from 'react';
import { InstagramVisitTaskSchema } from '@/lib/task/schemas';
import { SocialInstagramIcon } from '@giveaway/integration-icons/instagram';
import { cn } from '@giveaway/ui-utils/utils';
import { useTaskTheme } from '@/lib/task/components/theme';
import { Button } from '@giveaway/ui-primitives/button';
import Link from 'next/link';
import { Separator } from '@giveaway/ui-primitives/separator';
import { InstagramDisclaimer } from './disclaimer';
import { Input } from '@giveaway/ui-primitives/input';
import { Label } from '@giveaway/ui-primitives/label';
import {
  INSTAGRAM_USERNAME_QUESTION,
  INSTAGRAM_USERNAME_STORAGE_KEY
} from './constants';

export const InstagramVisitTaskActionForm: React.FC<
  TaskActionProps<InstagramVisitTaskSchema>
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

  useEffect(() => {
    if (
      submission?.proof &&
      typeof submission.proof === 'object' &&
      'answer' in submission.proof
    ) {
      const submittedUsername = submission.proof.answer as string;
      setUsername(submittedUsername);
      setOriginalUsername(submittedUsername);
      setUserInteracted(true);
    }
  }, [submission]);

  const handleSubmit = () => {
    if (username.trim()) {
      localStorage.setItem(INSTAGRAM_USERNAME_STORAGE_KEY, username.trim());
    }
    onSubmit({ answer: username.trim() });
    setUserInteracted(false);
  };

  const handleUpdate = () => {
    if (username.trim()) {
      localStorage.setItem(INSTAGRAM_USERNAME_STORAGE_KEY, username.trim());
    }
    onUpdate({ answer: username.trim() });
  };

  const handleVisit = () => {
    setUserInteracted(true);
  };

  const handleCancel = () => {
    setUserInteracted(false);
    onCancel();
  };

  const profileName = task.profileUrl
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, '')
    .replace(/\/$/, '');

  const hasUsernameChanged = submission && username !== originalUsername;

  const canSubmit = submission
    ? hasUsernameChanged && username.trim().length > 0
    : userInteracted && username.trim().length > 0;

  return (
    <>
      <TaskContent>
        <div className="flex flex-col items-center justify-center gap-4">
          <Button className={cn(theme.action)} asChild onClick={handleVisit}>
            <Link href={task.profileUrl} target="_blank">
              <SocialInstagramIcon />
              Visit @{profileName}
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
