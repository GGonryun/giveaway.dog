import { notFound } from 'next/navigation';
import { MarketingTemplateModal } from '@giveaway/marketing-learn/learn/marketing-template-modal';
import { getTemplateById } from '@giveaway/templates-model/data/static-templates';

interface TemplateModalPageProps {
  params: Promise<{
    templateId: string;
  }>;
}

export default async function TemplateModalPage({
  params
}: TemplateModalPageProps) {
  const { templateId } = await params;
  const template = getTemplateById(templateId);

  if (!template) {
    notFound();
  }

  return <MarketingTemplateModal template={template} />;
}
