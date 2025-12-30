import { TemplateFormPage } from '@/lib/templates/components/templates-form-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Create Template | Giveaway.dog',
    description: 'Create a new template',
    robots: {
      index: false,
      follow: false
    }
  };
}

export default TemplateFormPage;
