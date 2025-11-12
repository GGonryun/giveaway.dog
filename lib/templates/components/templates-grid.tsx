'use client';

import React, { useState } from 'react';
import { TemplateListItemSchema } from '../schemas/template';
import { TemplateCard } from './template-card';
import { UseTemplateModal } from './use-template-modal';
import { useProcedure } from '@/lib/mrpc/hook';
import { createSweepstakes } from '@/procedures/sweepstakes/create-sweepstakes';
import { useRouter } from 'next/navigation';

export const TemplatesGrid: React.FC<{
  slug: string;
  templates: TemplateListItemSchema[];
}> = ({ slug, templates }) => {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateListItemSchema | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const create = useProcedure({
    action: createSweepstakes,
    onSuccess: (data) => {
      router.push(`/app/${slug}/sweepstakes/${data.id}/create`);
    }
  });

  const handleClickTemplate = (template: TemplateListItemSchema) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleUseTemplate = (template: TemplateListItemSchema) => {
    create.run({ slug, templateId: template.id });
  };

  if (templates.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={handleClickTemplate}
          />
        ))}
      </div>

      <UseTemplateModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        template={selectedTemplate}
        onUse={handleUseTemplate}
      />
    </>
  );
};
