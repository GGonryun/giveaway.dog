'use client';

import React, { useState, useMemo } from 'react';

import { Input } from '@giveaway/ui-primitives/input';
import { Search } from 'lucide-react';
import { TemplateListItemSchema } from '../schemas/template';
import { TemplateCard } from './template-card';
import { UseTemplateModal } from './use-template-modal';
import { SweepstakesGridSkeleton } from './templates-grid-skeleton';
import { DeleteTemplateModal } from './delete-template-modal';
import { useProcedure } from '@/lib/mrpc/hook';
import { createSweepstakes } from '@/procedures/sweepstakes/create-sweepstakes';
import { useRouter } from 'next/navigation';
import { timezone } from '@giveaway/util-time/time';
import { useCreateTemplate } from '@/components/templates/use-create-template';

export const TemplatesPage: React.FC<{
  slug: string;
  templates: TemplateListItemSchema[];
}> = ({ slug, templates }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateListItemSchema | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staged, setDeleteTemplate] = useState<TemplateListItemSchema | null>(
    null
  );

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) {
      return templates;
    }

    const query = searchQuery.toLowerCase();
    return templates.filter((form) => {
      const matchesName = form.template.template.name
        .toLowerCase()
        .includes(query);
      const matchesDescription = form.template.template.description
        .toLowerCase()
        .includes(query);

      return matchesName || matchesDescription;
    });
  }, [templates, searchQuery]);

  const create = useProcedure({
    action: createSweepstakes,
    onSuccess: (data) => {
      router.push(`/app/${slug}/sweepstakes/${data.id}/create`);
    }
  });

  const createCustom = useCreateTemplate();

  const handleClickTemplate = (item: TemplateListItemSchema) => {
    setSelectedTemplate(item);
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

  const handleEditTemplate = (item: TemplateListItemSchema) => {
    router.push(`/app/${slug}/templates/${item.template.id}/edit`);
  };

  const handleDeleteTemplate = (item: TemplateListItemSchema) => {
    setDeleteTemplate(item);
  };

  return (
    <div>
      <div className="relative flex-1 mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      {templates.length === 0 ? (
        <SweepstakesGridSkeleton />
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No templates found matching &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((item) => (
            <TemplateCard
              key={item.template.id}
              item={item}
              slug={slug}
              onUse={handleClickTemplate}
              onDelete={handleDeleteTemplate}
            />
          ))}
        </div>
      )}

      <UseTemplateModal
        loading={create.isLoading || createCustom.isLoading}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        template={selectedTemplate}
        onUse={handleUseTemplate}
        onCustomize={handleCustomizeTemplate}
        onEdit={handleEditTemplate}
      />

      <DeleteTemplateModal
        onClose={() => setDeleteTemplate(null)}
        template={
          staged
            ? {
                id: staged.template.id,
                name: staged.template.template.name,
                slug
              }
            : null
        }
      />
    </div>
  );
};
