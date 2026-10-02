import { TemplateForm } from '@/lib/templates/components/template-form';
import { getTemplateForm } from '@/lib/templates/procedures/get-template-form';
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
