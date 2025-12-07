import { Button } from '@/components/ui/button';
import { SocialInstagramIcon } from '@/lib/integrations/components/icons/instagram';
import { useTaskTheme } from '@/lib/task/components/theme';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';
import Link from 'next/link';

export const ActionContainer: React.FC<{
  title: string;
  action: string;
  description: string;
  isCompleted: boolean;
  isDisabled: boolean;
  onSubmit: () => void;
  onVisit: () => void;
  help: string;
  url: string;
}> = ({
  title,
  action,
  description,
  isCompleted,
  isDisabled,
  onSubmit,
  onVisit,
  help,
  url
}) => {
  const { theme } = useTaskTheme();
  return (
    <div className="w-full max-w-md mx-auto space-y-4 mb-2">
      <div className="relative w-full overflow-hidden rounded-lg border bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-[2px]">
        <div className="bg-card rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
              <SocialInstagramIcon className="size-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {isCompleted
              ? '✨ Great! Now click "Complete Task" below to confirm.'
              : `Click the button below to open Instagram and ${help}, then come back to confirm.`}
          </div>

          <div className="text-xs text-muted-foreground/70 border-t pt-3">
            This promotion is in no way sponsored, administered, or associated
            with Instagram. Instagram is not responsible for this activity.
          </div>

          {isCompleted || isDisabled ? (
            <Button
              className={cn(theme.action, 'w-full')}
              onClick={onSubmit}
              disabled={isDisabled}
            >
              <CheckIcon />
              Complete Task
            </Button>
          ) : (
            <Button
              className={cn(theme.action, 'w-full')}
              asChild
              onClick={onVisit}
            >
              <Link href={url} target="_blank">
                <SocialInstagramIcon />
                {action}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
