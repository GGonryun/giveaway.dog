import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '@giveaway/task-entry-core/building-blocks';
import { FacebookViewPostTaskSchema } from '@giveaway/task-model/schemas';
import { SocialFacebookIcon } from '@giveaway/integration-icons/facebook-icon';
import { FacebookDisclaimer } from './disclaimer';
import { Separator } from '@giveaway/ui-primitives/separator';

export const FacebookViewPostTaskActionForm: React.FC<
  TaskActionProps<FacebookViewPostTaskSchema>
> = ({ onSubmit, onCancel, task, submission, isLoading }) => {
  const embedUrl = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(task.postUrl)}&show_text=true&width=500`;

  return (
    <>
      <TaskContent>
        <div className="flex flex-col gap-3 items-center w-full">
          <iframe
            src={embedUrl}
            className="w-full min-h-[200px] cursor-pointer"
            style={{ border: 'none', overflow: 'hidden' }}
            allowFullScreen={true}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          />
          <Separator />
          <FacebookDisclaimer />
        </div>
      </TaskContent>
      <TaskControls
        submission={submission}
        isLoading={isLoading}
        onSubmit={onSubmit}
        onCancel={onCancel}
        cancel={{
          className: 'hidden'
        }}
        submit={{
          label: 'Complete Task',
          icon: SocialFacebookIcon
        }}
      />
    </>
  );
};
