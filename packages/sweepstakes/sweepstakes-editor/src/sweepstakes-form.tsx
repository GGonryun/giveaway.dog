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
  GiveawayFormSchema,
  giveawayFormSchema,
  GiveawayState
} from '@giveaway/sweepstakes-model/schemas';
import React, { useCallback, useEffect, useState } from 'react';

import { SweepstakesFormPreview } from '@giveaway/sweepstakes-editor-preview/sweepstakes-editor-preview';
import { useSweepstakesPage } from '@giveaway/sweepstakes-routes/use-sweepstakes-page';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useDeleteDraft } from '@giveaway/sweepstakes-actions-ui/use-delete-sweepstakes';
import { useProcedure } from '@giveaway/rpc-client/hook';
import updateSweepstakes from '@giveaway/sweepstakes-editor-server/update-sweepstakes';
import publishSweepstakes from '@giveaway/sweepstakes-editor-server/publish-sweepstakes';
import { PreviewStateContext } from '@giveaway/sweepstakes-editor-core/contexts/preview-state-context';

import { useBeforeUnload } from '@giveaway/ui-hooks/use-before-unload';
import { UnifiedFormLayoutContextProvider } from '@giveaway/ui-layouts/form-layout/use-unified-form-layout';
import { IntegrationsSchema } from '@giveaway/integration-model/schemas';
import {
  SWEEPSTAKE_FIELD_TO_STEP_MAP,
  isSweepstakeStepKey,
  SWEEPSTAKE_STEP_TO_FIELD_MAP,
  SWEEPSTAKE_STEP_LABELS,
  SWEEPSTAKE_STEP_ORDER,
  SweepstakeStep
} from '@giveaway/sweepstakes-editor-core/steps';
import { SweepstakesPreviewFooter } from '@giveaway/sweepstakes-editor-preview/sweepstakes-preview-footer';
import { UnifiedFormAction } from '@giveaway/ui-layouts/form-layout/types';
import { SweepstakeFormContent } from './sweepstake-form-content';
import { CancelConfirmationModal } from '@giveaway/sweepstakes-ui/cancel-confirmation-modal';
import { PublishConfirmationModal } from '@giveaway/sweepstakes-editor-core/publish-confirmation-modal';
import { useSweepstakesDetailsPage } from '@giveaway/sweepstakes-routes/use-sweepstakes-details-page';
import {
  SlugAvailability,
  slugAvailability
} from '@giveaway/sweepstakes-editor-audience/slug-availability';

export const SweepstakesForm: React.FC<{
  sweepstakes: GiveawayFormSchema;
  integrations: IntegrationsSchema;
  maxLoyalty: number;
  isDemo?: boolean;
}> = ({
  sweepstakes: defaultValues,
  integrations,
  maxLoyalty,
  isDemo = false
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const id = params.id as string;
  const rawStep = searchParams.get('step');
  const step = isSweepstakeStepKey(rawStep) ? rawStep : 'setup';

  const action = isDemo
    ? 'demo'
    : pathname.includes('/edit')
      ? 'edit'
      : 'create';

  const [slugs] = useState(() => slugAvailability(id));

  const form = useForm<GiveawayFormSchema>({
    resolver: slugs.resolver(
      zodResolver(giveawayFormSchema({ validate: !isDemo, maxLoyalty }))
    ),
    defaultValues,
    mode: 'onChange'
  });

  const startDate = useWatch({
    control: form.control,
    name: 'timing.startDate'
  });

  const [previewState, setPreviewState] = useState<GiveawayState>('active');

  useEffect(() => {
    form.trigger('timing.endDate');
  }, [startDate, form.trigger]);

  if (action !== 'demo' && (!id || typeof id !== 'string'))
    return <div>Invalid ID: {id}</div>;

  return (
    <PreviewStateContext.Provider value={{ previewState, setPreviewState }}>
      <FormProvider {...form}>
        <FormContent
          id={id}
          step={step}
          action={action}
          integrations={integrations}
          slugs={slugs}
        />
      </FormProvider>
    </PreviewStateContext.Provider>
  );
};

const FormContent: React.FC<{
  id: string;
  step: SweepstakeStep;
  integrations: IntegrationsSchema;
  action: UnifiedFormAction;
  slugs: SlugAvailability;
}> = ({ id, integrations, action, step, slugs }) => {
  const detailsPage = useSweepstakesDetailsPage();
  const sweepstakesPage = useSweepstakesPage();

  const [showIssues, setShowIssues] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const form = useFormContext<GiveawayFormSchema>();

  useBeforeUnload(form.formState.isDirty && action !== 'demo');

  const deleteDraft = useDeleteDraft(() => {
    toast.success('Sweepstakes deleted successfully!');
    sweepstakesPage.navigateTo();
  });

  const returnToPage = () => {
    if (action === 'edit' || action === 'view') {
      detailsPage.navigateTo(id);
    } else {
      sweepstakesPage.navigateTo();
    }
  };

  const updateSweepstakesProcedure = useProcedure({
    action: updateSweepstakes,
    onSuccess: () => {
      toast.success('Sweepstakes updated successfully!');
      returnToPage();
    }
  });

  const publishSweepstakesProcedure = useProcedure({
    action: publishSweepstakes,
    onSuccess() {
      toast.success('Sweepstakes published successfully!');
      returnToPage();
    }
  });

  const name = useWatch({
    control: form.control,
    name: 'setup.name'
  });

  const handleSubmitValid = useCallback(async () => {
    await form.trigger();

    setShowPublishModal(true);
  }, [form.trigger, setShowPublishModal]);

  const handleSubmitInvalid = useCallback(async () => {
    await form.trigger();

    setShowIssues(true);
  }, [form.trigger, setShowPublishModal]);

  const handleCancel = useCallback(() => {
    // check if form is dirty
    if (form.formState.isDirty || action === 'create' || action === 'demo') {
      setShowCancelModal(true);
    } else {
      returnToPage();
    }
  }, [form.formState.isDirty, returnToPage, action]);

  const handleSaveChanges = useCallback(async () => {
    if (action === 'demo') {
      toast.info('Demo Mode: Saving is disabled in the demo.');
      return;
    }

    const currentValues = form.getValues();
    updateSweepstakesProcedure.run({ id, ...currentValues });
  }, [id, updateSweepstakesProcedure, action]);

  const handleCancelSubmission = async () => {
    setShowPublishModal(false);
  };

  const handleDiscardChanges = useCallback(async () => {
    if (action === 'demo') {
      window.history.back();
      return;
    }

    if (action === 'create') {
      deleteDraft.run({ id });
    } else {
      returnToPage();
    }
  }, [deleteDraft.run, action, id]);

  const handlePublish = useCallback(async () => {
    if (action === 'demo') {
      toast.info('Demo Mode: Publishing is disabled in the demo.');
      return;
    }

    const currentValues = form.getValues();
    publishSweepstakesProcedure.run({ id, ...currentValues });
  }, [id, publishSweepstakesProcedure, action]);

  const handleClosePublishModal = () => setShowPublishModal(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (action !== 'demo') {
      await slugs.verify(form.getValues('visibility.slug'));
    }
    await form.handleSubmit(handleSubmitValid, handleSubmitInvalid)(event);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <UnifiedFormLayoutContextProvider
          id={id}
          title={name}
          disabled={
            deleteDraft.isLoading ||
            updateSweepstakesProcedure.isLoading ||
            publishSweepstakesProcedure.isLoading
          }
          showIssues={showIssues}
          defaultStep={step}
          setShowIssues={setShowIssues}
          onCancel={handleCancel}
          onSave={handleSaveChanges}
          form={<SweepstakeFormContent />}
          preview={<SweepstakesFormPreview />}
          integrations={integrations}
          previewFooter={<SweepstakesPreviewFooter />}
          type={'sweepstake'}
          action={action}
          stepOrder={SWEEPSTAKE_STEP_ORDER}
          stepsToFields={SWEEPSTAKE_STEP_TO_FIELD_MAP}
          fieldsToSteps={SWEEPSTAKE_FIELD_TO_STEP_MAP}
          stepLabels={SWEEPSTAKE_STEP_LABELS}
        />

        <CancelConfirmationModal
          onClose={() => setShowCancelModal(false)}
          open={showCancelModal}
          isLoading={
            deleteDraft.isLoading || updateSweepstakesProcedure.isLoading
          }
          action={action}
          onDiscard={handleDiscardChanges}
          onSave={handleSaveChanges}
        />

        <PublishConfirmationModal
          open={showPublishModal}
          onClose={handleClosePublishModal}
          onCancel={handleCancelSubmission}
          onSave={handleSaveChanges}
          onPublish={handlePublish}
          isPublishing={publishSweepstakesProcedure.isLoading}
          isSaving={updateSweepstakesProcedure.isLoading}
          action={action}
          name={name}
        />
      </form>
    </>
  );
};
