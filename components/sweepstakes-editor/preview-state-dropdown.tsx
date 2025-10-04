import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { ChevronDownIcon } from 'lucide-react';
import { usePreviewState } from './contexts/preview-state-context';
import {
  getStateDisplayLabel,
  PREVIEW_GIVEAWAY_STATES
} from '@/schemas/giveaway/schemas';

export const PreviewStateDropdown = () => {
  const { previewState, setPreviewState } = usePreviewState();
  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {getStateDisplayLabel(previewState)}
            <ChevronDownIcon className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {PREVIEW_GIVEAWAY_STATES.map((state) => (
            <DropdownMenuItem
              key={state}
              onClick={() => setPreviewState(state)}
            >
              {getStateDisplayLabel(state)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
