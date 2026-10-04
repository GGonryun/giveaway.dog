'use client';

import { EntryMethods } from '@/lib/task/components/entry-methods/entry-methods';
import { useFormContext } from 'react-hook-form';
import { TemplateFormSchema } from '@giveaway/templates-model/schemas/template';

export const TemplateTasks = () => {
  const form = useFormContext<TemplateFormSchema>();
  return <EntryMethods form={form} fieldPath="tasks" action="create" />;
};
