'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UseTemplateModal } from '@/lib/templates/components/use-template-modal';
import { TemplateDetailsSchema } from '@/lib/templates/schemas/template';
import { TemplateListItemSchema } from '@/lib/templates/schemas/template';

interface MarketingTemplateModalProps {
  template: TemplateDetailsSchema;
}

const useTemplateIdFromPath = () => {
  const pathname = usePathname();
  const match = pathname.match(/\/learn\/templates\/([^/]+)/);
  return match ? match[1] : undefined;
};

export function MarketingTemplateModal({
  template
}: MarketingTemplateModalProps) {
  const router = useRouter();
  const templateId = useTemplateIdFromPath();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!!templateId);
  }, [templateId]);

  const handleClose = (status: boolean) => {
    if (!status) {
      setOpen(false);
      router.push('/learn/templates');
    }
  };

  const handleUse = () => {
    router.push('/login');
  };

  const handleCustomize = () => {
    router.push('/login');
  };

  // Convert TemplateDetailsSchema to TemplateListItemSchema format
  const templateListItem: TemplateListItemSchema = {
    teamId: 'giveaway-dog',
    team: {
      name: 'Giveaway.dog',
      slug: 'giveaway-dog',
      logo: ''
    },
    createdBy: {
      id: 'official',
      name: 'Giveaway.dog',
      image: null
    },
    template: {
      ...template,
      id: template.id
    },
    isCustom: false
  };

  return (
    <UseTemplateModal
      open={open}
      onOpenChange={handleClose}
      template={templateListItem}
      onUse={handleUse}
      onCustomize={handleCustomize}
    />
  );
}
