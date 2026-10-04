'use client';

import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useCallback, useState } from 'react';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { MobileSuspense } from '@giveaway/ui-primitives/mobile-suspense';
import { UnifiedFormAction } from '@giveaway/ui-layouts/form-layout/types';
import { UnifiedFormLayoutContextProvider } from '@giveaway/ui-layouts/form-layout/use-unified-form-layout';
import {
  TWITTER_V2_PICKER_STEP_LABELS,
  TWITTER_V2_PICKER_STEP_ORDER,
  TWITTER_V2_PICKER_STEP_TO_FIELD_MAP,
  TWITTER_V2_PICKER_FIELD_TO_STEP_MAP
} from '../data/steps';
import { TwitterV2SetupSection } from './sections/setup-section';
import { TwitterV2FiltersSection } from './sections/filters-section';
import { deleteTwitterV2Picker } from '@giveaway/x-picker-server/procedures/delete-twitter-v2-picker';
import { useProcedure } from '@giveaway/rpc-client/hook';
import {
  DEFAULT_TWITTER_V2_PICKER_FORM,
  DEFAULT_TWITTER_V2_PICKER_NAME
} from '@giveaway/x-picker-model/defaults';
import {
  TwitterV2PickerFormSchema,
  twitterV2PickerFormSchema,
  TwitterV2PickerUnvalidatedFormSchema
} from '@giveaway/x-picker-model/schemas/form';
import { useTwitterV2PickersPage } from '../hooks/use-twitter-v2-pickers-page';
import { TwitterV2CancelConfirmationModal } from './twitter-v2-cancel-confirmation-modal';
import { TwitterV2PublishConfirmationModal } from './twitter-v2-publish-confirmation-modal';
import { TwitterV2PickerPreview } from './twitter-v2-picker-preview';
import { updateTwitterV2Picker } from '@giveaway/x-picker-server/procedures/update-twitter-v2-picker';
import { publishTwitterV2Picker } from '@giveaway/x-picker-server/procedures/publish-twitter-v2-picker';
import { useActiveTeam } from '@giveaway/team-context/use-active-team-page';

export interface TwitterV2PickerFormProps {
  picker: Omit<TwitterV2PickerUnvalidatedFormSchema, 'id'>;
  isDemo?: boolean;
}

export const TwitterV2PickerForm: React.FC<TwitterV2PickerFormProps> = ({
  picker,
  isDemo = false
}) => {
  const pathname = usePathname();
  const params = useParams();

  const pickerId = params.pickerId as string;
  const action = isDemo
    ? 'demo'
    : pathname.includes('/edit')
      ? 'edit'
      : 'create';

  const form = useForm<TwitterV2PickerFormSchema>({
    resolver: zodResolver(twitterV2PickerFormSchema({ validateTiming: true })),
    defaultValues: picker || DEFAULT_TWITTER_V2_PICKER_FORM,
    mode: 'onChange'
  });

  return (
    <MobileSuspense>
      <FormProvider {...form}>
        <FormContent pickerId={pickerId} action={action} />
      </FormProvider>
    </MobileSuspense>
  );
};

interface FormContentProps {
  pickerId: string;
  action: UnifiedFormAction;
}

const FormContent: React.FC<FormContentProps> = ({ pickerId, action }) => {
  const router = useRouter();
  const page = useTwitterV2PickersPage();
  const team = useActiveTeam();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showIssues, setShowIssues] = useState(false);

  const form = useFormContext<TwitterV2PickerFormSchema>();

  const deleteProcedure = useProcedure({
    action: deleteTwitterV2Picker,
    onSuccess: () => {
      toast.success('Picker deleted successfully!');
      page.navigateTo({ path: 'list' });
    }
  });

  const updateProcedure = useProcedure({
    action: updateTwitterV2Picker,
    onSuccess: () => {
      toast.success('Picker saved successfully!');
      form.reset(form.getValues());
      router.push(`/app/${team.slug}/pickers/x`);
    }
  });

  const publishProcedure = useProcedure({
    action: publishTwitterV2Picker,
    onSuccess: () => {
      toast.success('Picker published successfully!');
      setShowPublishModal(false);
      router.push(`/app/${team.slug}/pickers/x/${pickerId}`);
    }
  });

  const handleSubmitValid = useCallback(() => {
    setShowPublishModal(true);
  }, []);

  const handlePublish = useCallback(() => {
    if (action === 'demo') return;
    publishProcedure.run({ pickerId, slug: team.slug, data: form.getValues() });
  }, [action, form, pickerId, team.slug, publishProcedure]);

  const handleSubmitInvalid = useCallback(async () => {
    await form.trigger();
    setShowIssues(true);
  }, [form]);

  const handleCancel = useCallback(() => {
    const isDirty = form.formState.isDirty;
    if (isDirty || action === 'create' || action === 'demo') {
      setShowCancelModal(true);
    } else {
      page.navigateTo({ path: 'list' });
    }
  }, [form.formState.isDirty, page, action]);

  const handleSaveChanges = useCallback(async () => {
    if (action === 'demo') {
      toast.info('Demo Mode: Saving is disabled in the demo.');
      return;
    }

    const isValid = await form.trigger();
    if (!isValid) {
      toast.error('Please fix validation errors before saving.');
      setShowIssues(true);
      return;
    }

    const formData = form.getValues();
    updateProcedure.run({
      pickerId,
      slug: team.slug,
      data: formData
    });
  }, [action, form, pickerId, team.slug, updateProcedure]);

  const handleDiscardChanges = useCallback(async () => {
    if (action === 'demo') {
      window.history.back();
      return;
    }

    if (action === 'create') {
      deleteProcedure.run({ pickerId });
    } else {
      page.navigateTo({ path: 'list' });
    }
  }, [deleteProcedure, action, pickerId, page]);

  const isLoading =
    deleteProcedure.isLoading ||
    updateProcedure.isLoading ||
    publishProcedure.isLoading;

  return (
    <>
      <form
        onSubmit={form.handleSubmit(handleSubmitValid, handleSubmitInvalid)}
      >
        <UnifiedFormLayoutContextProvider
          id={pickerId}
          integrations={[]}
          title={DEFAULT_TWITTER_V2_PICKER_NAME}
          type="picker"
          disabled={isLoading}
          action={action}
          defaultStep="setup"
          stepOrder={TWITTER_V2_PICKER_STEP_ORDER}
          stepsToFields={TWITTER_V2_PICKER_STEP_TO_FIELD_MAP}
          fieldsToSteps={TWITTER_V2_PICKER_FIELD_TO_STEP_MAP}
          stepLabels={TWITTER_V2_PICKER_STEP_LABELS}
          onCancel={handleCancel}
          onSave={handleSaveChanges}
          showIssues={showIssues}
          setShowIssues={setShowIssues}
          hideTabs={true}
          form={<TwitterV2PickerFormContent />}
          preview={<TwitterV2PickerPreviewWrapper />}
          previewFooter={undefined}
        />
      </form>

      <TwitterV2CancelConfirmationModal
        onClose={() => setShowCancelModal(false)}
        open={showCancelModal}
        isLoading={isLoading}
        action={action}
        onDiscard={handleDiscardChanges}
        onSave={handleSaveChanges}
      />

      <TwitterV2PublishConfirmationModal
        open={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onCancel={() => setShowPublishModal(false)}
        onSave={() => {
          setShowPublishModal(false);
          handleSaveChanges();
        }}
        onPublish={handlePublish}
        isUpdating={updateProcedure.isLoading}
        isPublishing={publishProcedure.isLoading}
        isScheduled={form.watch('timing') != null}
        action={action}
      />
    </>
  );
};

const TwitterV2PickerFormContent: React.FC = () => {
  return (
    <>
      <TwitterV2SetupSection />
      <TwitterV2FiltersSection />
    </>
  );
};

const TwitterV2PickerPreviewWrapper: React.FC = () => {
  return <TwitterV2PickerPreview />;
};
