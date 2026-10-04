'use client';

import { useCreateTemplate } from '@/components/templates/use-create-template';
import { Button } from '@giveaway/ui-primitives/button';
import { Plus } from 'lucide-react';

export const CreateTemplateButton = () => {
  const createTemplate = useCreateTemplate();

  const handleCreateTemplate = () => {
    createTemplate.run();
  };

  return (
    <div>
      <Button onClick={handleCreateTemplate} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Create
      </Button>
    </div>
  );
};
