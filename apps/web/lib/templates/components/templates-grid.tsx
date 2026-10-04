'use client';

import React, { useState } from 'react';
import { TemplateListItemSchema } from '../schemas/template';
import { TemplateCard } from './template-card';
import { UseTemplateModal } from './use-template-modal';
import { useProcedure } from '@giveaway/rpc-client/hook';
import { createSweepstakes } from '@/procedures/sweepstakes/create-sweepstakes';
import { useRouter } from 'next/navigation';
import { timezone } from '@giveaway/util-time/time';
import { useCreateTemplate } from '@/components/templates/use-create-template';

export const TemplatesGrid: React.FC<{
  slug: string;
  items: TemplateListItemSchema[];
}> = ({ slug, items }) => {
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

  const createCustom = useCreateTemplate();

  const handleClickTemplate = (template: TemplateListItemSchema) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleUseTemplate = (item: TemplateListItemSchema) => {
    create.run({
      slug,
      templateId: item.template.id,
      timezone: timezone.current()
    });
  };

  const handleCustomizeTemplate = (item: TemplateListItemSchema) => {
    createCustom.run({ sourceTemplateId: item.template.id });
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <TemplateCard
            key={item.template.id}
            item={item}
            slug={slug}
            onUse={handleClickTemplate}
          />
        ))}
      </div>

      <UseTemplateModal
        open={isModalOpen}
        loading={create.isLoading || createCustom.isLoading}
        onOpenChange={setIsModalOpen}
        template={selectedTemplate}
        onUse={handleUseTemplate}
        onCustomize={handleCustomizeTemplate}
      />
    </>
  );
};
