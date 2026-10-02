'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProcedure } from '@/lib/mrpc/hook';
import { toast } from 'sonner';
import { createTemplate } from '@/lib/templates/procedures/create-template';

export function useCreateTemplate() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const procedure = useProcedure({
    action: createTemplate,
    onSuccess: (data) => {
      router.push(`/app/${slug}/templates/${data.id}/create`);
    },
    onFailure: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    }
  });

  return {
    ...procedure,
    run: (options?: { sourceTemplateId?: string }) =>
      procedure.run({
        slug,
        sourceTemplateId: options?.sourceTemplateId
      })
  };
}
