import { ChevronDownIcon } from 'lucide-react';
import {
  getStateDisplayLabel,
  PREVIEW_GIVEAWAY_STATES
} from '@giveaway/sweepstakes-model/schemas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@giveaway/ui-primitives/dropdown-menu';
import { Button } from '@giveaway/ui-primitives/button';
import { usePreviewState } from './contexts/preview-state-context';

export const SweepstakesPreviewFooter: React.FC = () => {
  return (
    <div className="bg-background border-t p-3">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">Preview Mode</div>
        <SweepstakesPreviewStateDropdown />
      </div>
    </div>
  );
};

const SweepstakesPreviewStateDropdown: React.FC = () => {
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
