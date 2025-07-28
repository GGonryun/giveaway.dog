import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { HelpCircleIcon } from 'lucide-react';
export const HelpTooltip: React.FC<{ content: React.ReactNode }> = ({
  content
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircleIcon className="h-4 w-4 text-primary-foreground bg-primary rounded-full" />
      </TooltipTrigger>
      <TooltipContent className="max-w-52">{content}</TooltipContent>
    </Tooltip>
  );
};
