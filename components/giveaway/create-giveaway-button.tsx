'use client';

import { Button } from '../ui/button';
import { PlusIcon, ChevronDown, FileText, Sparkles } from 'lucide-react';
import { createSweepstakes } from '@/actions/app/create-sweepstakes';
import { Spinner } from '../ui/spinner';
import { useRouter } from 'next/navigation';
import z from 'zod';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { useProcedure } from '@/lib/mrpc/hook';

export const CreateGiveawayButton = () => {
  const router = useRouter();

  const [isPending, onClick] = useProcedure({
    action: createSweepstakes,
    onSuccess: (data) => {
      router.push(`/app/create/${data.id}`);
    }
  });

  const handleFromTemplate = () => {
    router.push('/app/templates');
  };

  return (
    <div className="flex -mt-0.5">
      <Button
        variant="secondary"
        size="sm"
        className="rounded-r-none"
        disabled={isPending}
        onClick={() => onClick()}
      >
        {isPending ? <Spinner /> : <PlusIcon />}
        {isPending ? 'Creating...' : 'Create'}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-l-none border-l px-2"
            disabled={isPending}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onClick} disabled={isPending}>
            <FileText className="h-4 w-4 mr-2" />
            Start from scratch
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleFromTemplate}>
            <Sparkles className="h-4 w-4 mr-2" />
            Use a template
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
