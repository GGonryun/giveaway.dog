'use client';

import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  templateFormSchema,
  TemplateFormSchema,
  TemplateInputSchema
} from '../schemas/template';
import React, { useCallback, useState } from 'react';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams
} from 'next/navigation';
import { useProcedure } from '@giveaway/rpc-client/hook';
import { updateTemplate } from '../procedures/update-template';
import { UnifiedFormLayoutContextProvider } from '@giveaway/ui-layouts/form-layout/use-unified-form-layout';
import {
  TEMPLATE_FIELD_TO_STEP_MAP,
  isTemplateStepKey,
  TEMPLATE_STEP_TO_FIELD_MAP,
  TEMPLATE_STEP_LABELS,
  TEMPLATE_STEP_ORDER,
  TemplateStep
} from '../data/steps';
import { UnifiedFormAction } from '@giveaway/ui-layouts/form-layout/types';
import { TemplateFormContent } from './template-form-content';
import { TemplatePreview } from './template-preview';
import { TemplatePreviewFooter } from './template-preview-footer';
import { PreviewStateContext } from '@/components/sweepstakes-editor/contexts/preview-state-context';
import { GiveawayState } from '@giveaway/sweepstakes-model/schemas';
import { IntegrationsSchema } from '@giveaway/integration-model/schemas';
import { TemplatePublishConfirmationModal } from './template-publish-confirmation-modal';
import { TemplateCancelConfirmationModal } from './template-cancel-confirmation-modal';
import { deleteTemplate } from '../procedures/delete-template';

const ACTION_BANNER_TITLES: Record<UnifiedFormAction, string> = {
  create: 'Creating Template',
  edit: 'Editing Template',
  demo: 'Demo Mode',
  view: 'Viewing Template'
};

export const TemplateForm: React.FC<{
  template: TemplateInputSchema;
  integrations: IntegrationsSchema;
}> = ({ template: defaultValues, integrations }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = params.slug as string;
  const templateId = params.templateId as string;
  const rawStep = searchParams.get('step');
  const step = isTemplateStepKey(rawStep) ? rawStep : 'template';

  const action: UnifiedFormAction = pathname.includes('/edit')
    ? 'edit'
    : 'create';

  const form = useForm<TemplateFormSchema>({
    resolver: zodResolver(templateFormSchema),
    defaultValues,
    mode: 'onChange'
  });

  const [previewState, setPreviewState] = useState<GiveawayState>('active');

  return (
    <PreviewStateContext.Provider value={{ previewState, setPreviewState }}>
      <FormProvider {...form}>
        <FormContent
          templateId={templateId}
          slug={slug}
          step={step}
          action={action}
          integrations={integrations}
        />
      </FormProvider>
    </PreviewStateContext.Provider>
  );
};

const FormContent: React.FC<{
  templateId: string;
  slug: string;
  step: TemplateStep;
  action: UnifiedFormAction;
  integrations: IntegrationsSchema;
}> = ({ templateId, slug, step, action, integrations }) => {
  const router = useRouter();

  const [showIssues, setShowIssues] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const form = useFormContext<TemplateFormSchema>();

  const returnToPage = () => {
    router.push(`/app/${slug}/templates`);
  };

  const updateProcedure = useProcedure({
    action: updateTemplate,
    onSuccess: () => {
      toast.success('Template updated successfully!');
      returnToPage();
    }
  });

  const deleteProcedure = useProcedure({
    action: deleteTemplate,
    onSuccess: () => {
      toast.success('Template deleted successfully!');
      returnToPage();
    }
  });

  const name = useWatch({
    control: form.control,
    name: 'template.name'
  });

  const handleSubmitValid = async () => {
    await form.trigger();
    setShowPublishModal(true);
  };

  const handleSubmitInvalid = async () => {
    await form.trigger();
    setShowPublishModal(true);
  };

  const handleCancel = useCallback(() => {
    // check if form is dirty
    if (form.formState.isDirty || action === 'create' || action === 'demo') {
      setShowCancelModal(true);
    } else {
      returnToPage();
    }
  }, [form.formState.isDirty, returnToPage, action]);

  const handleSaveChanges = async () => {
    const currentValues = form.getValues();
    updateProcedure.run({ id: templateId, ...currentValues });
  };

  const handleDiscardChanges = async () => {
    if (action === 'create') {
      deleteProcedure.run({ templateId, slug });
    } else {
      returnToPage();
    }
  };

  const handleClosePublishModal = () => {
    setShowPublishModal(false);
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmitValid, handleSubmitInvalid)}>
      <UnifiedFormLayoutContextProvider
        id={templateId}
        title={name}
        disabled={deleteProcedure.isLoading || updateProcedure.isLoading}
        showIssues={showIssues}
        defaultStep={step}
        setShowIssues={setShowIssues}
        onCancel={handleCancel}
        onSave={handleSaveChanges}
        form={<TemplateFormContent />}
        preview={<TemplatePreview />}
        integrations={integrations}
        previewFooter={<TemplatePreviewFooter />}
        type={'template'}
        action={action}
        stepOrder={TEMPLATE_STEP_ORDER}
        stepsToFields={TEMPLATE_STEP_TO_FIELD_MAP}
        fieldsToSteps={TEMPLATE_FIELD_TO_STEP_MAP}
        stepLabels={TEMPLATE_STEP_LABELS}
        banner={{
          title: ACTION_BANNER_TITLES[action],
          fullMessage: '- Reuse sweepstakes for future campaigns.',
          shortMessage: '- Reuse a sweepstake.'
        }}
      />

      <TemplateCancelConfirmationModal
        onClose={handleCloseCancelModal}
        open={showCancelModal}
        isLoading={deleteProcedure.isLoading || updateProcedure.isLoading}
        action={action}
        onDiscard={handleDiscardChanges}
        onSave={handleSaveChanges}
      />

      <TemplatePublishConfirmationModal
        open={showPublishModal}
        onClose={handleClosePublishModal}
        onCancel={handleClosePublishModal}
        onSave={handleSaveChanges}
        isSaving={updateProcedure.isLoading}
        action={action}
        name={name || 'New Template'}
      />
    </form>
  );
};
