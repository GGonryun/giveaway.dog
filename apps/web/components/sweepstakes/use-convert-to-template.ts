'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProcedure } from '@/lib/mrpc/hook';
import { convertSweepstakesToTemplate } from '@/lib/templates/procedures/convert-sweepstakes-to-template';
import { toast } from 'sonner';

export function useConvertToTemplate() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const procedure = useProcedure({
    action: convertSweepstakesToTemplate,
    onSuccess: (data) => {
      toast.success('Sweepstakes converted to template successfully!');
      router.push(`/app/${slug}/templates/${data.id}/edit`);
      router.refresh();
    },
    onFailure: (error) => {
      toast.error(`Failed to convert to template: ${error.message}`);
    }
  });

  return {
    ...procedure,
    run: (input: { id: string }) => procedure.run({ ...input, slug })
  };
}
