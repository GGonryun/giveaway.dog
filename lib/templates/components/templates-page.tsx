'use client';

import React, { useState, useMemo } from 'react';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { TemplateListItemSchema } from '../schemas/template';
import { TemplateCard } from './template-card';
import { UseTemplateModal } from './use-template-modal';
import { SweepstakesGridSkeleton } from './templates-grid-skeleton';
import { useProcedure } from '@/lib/mrpc/hook';
import { createSweepstakes } from '@/procedures/sweepstakes/create-sweepstakes';
import { useRouter } from 'next/navigation';

export const TemplatesPage: React.FC<{
  slug: string;
  templates: TemplateListItemSchema[];
}> = ({ slug, templates }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateListItemSchema | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) {
      return templates;
    }

    const query = searchQuery.toLowerCase();
    return templates.filter((template) => {
      const matchesName = template.name.toLowerCase().includes(query);
      const matchesDescription = template.description
        .toLowerCase()
        .includes(query);
      const matchesTags = template.tags.some((tag) =>
        tag.toLowerCase().includes(query)
      );

      return matchesName || matchesDescription || matchesTags;
    });
  }, [templates, searchQuery]);

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

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
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
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={handleClickTemplate}
            />
          ))}
        </div>
      )}

      <UseTemplateModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        template={selectedTemplate}
        onUse={({ id: templateId }) => {
          create.run({ slug, templateId });
        }}
      />
    </div>
  );
};
