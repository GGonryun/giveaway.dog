import { TemplateForm } from '@giveaway/templates-editor/template-form';
import { getTemplateForm } from '@giveaway/templates-server/get-template-form';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import TemplateFormPage from '../create/page';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Edit Template | Giveaway.dog',
    description: 'Edit your template',
    robots: {
      index: false,
      follow: false
    }
  };
}

export default TemplateFormPage;
