import { render, RenderResult } from '@testing-library/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { VisibilityType } from '@prisma/client';
import React, { useEffect } from 'react';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import { UnifiedFormLayoutContext } from '@/components/patterns/form-layout/use-unified-form-layout';
import {
  DEFAULT_ALLOW_MULTIPLE_WINS,
  DEFAULT_ALLOW_USER_SELECTION,
  DEFAULT_CLAIM_DEADLINE_DAYS,
  DEFAULT_DESIGN_DATA,
  DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
  DEFAULT_MIN_QUALITY_SCORE,
  DEFAULT_MIN_TASK_COMPLETED,
  DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
  DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND,
  DEFAULT_SPONSOR_NAME,
  DEFAULT_WINNER_SELECTION_METHOD
} from '@/schemas/giveaway/defaults';
import {
  giveawayFormSchema,
  GiveawayFormSchema,
  GiveawayTerms
} from '@/schemas/giveaway/schemas';
import {
  DEFAULT_ALLOWED_IDENTITIES,
  DEFAULT_REQUIRED_PRE_ENTRY_LOGIN
} from '@giveaway/app-config/settings';
import { toDefaultValues } from '@/lib/task/defaults';

export const FIXED_NOW = new Date('2026-06-15T12:00:00.000Z');

export type GiveawayForm = UseFormReturn<GiveawayFormSchema>;

export type LayoutValue = React.ContextType<typeof UnifiedFormLayoutContext>;

export type TemplateTerms = Extract<GiveawayTerms, { type: 'TEMPLATE' }>;

export const buildTemplateTerms = (
  overrides: Partial<TemplateTerms> = {}
): TemplateTerms => ({
  type: 'TEMPLATE',
  sponsorName: DEFAULT_SPONSOR_NAME,
  sponsorAddress: '',
  winnerSelectionMethod: DEFAULT_WINNER_SELECTION_METHOD,
  notificationTimeframeDays: DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
  claimDeadlineDays: DEFAULT_CLAIM_DEADLINE_DAYS,
  governingLawCountry: DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
  privacyPolicyUrl: '',
  additionalTerms: '',
  ...overrides
});

export const buildFormValues = (
  overrides: Partial<GiveawayFormSchema> = {}
): GiveawayFormSchema => ({
  setup: {
    name: 'Summer Giveaway',
    description: '<p>Win a summer prize</p>',
    banner: ''
  },
  terms: buildTemplateTerms(),
  timing: {
    startDate: new Date('2026-07-01T12:00:00.000Z'),
    endDate: new Date('2026-07-15T12:00:00.000Z'),
    timeZone: 'UTC'
  },
  audience: {
    allowedIdentities: [...DEFAULT_ALLOWED_IDENTITIES],
    regionalRestriction: null,
    requirePreEntryLogin: DEFAULT_REQUIRED_PRE_ENTRY_LOGIN,
    formFields: []
  },
  tasks: [{ ...toDefaultValues('BONUS_TASK'), id: 'task-1' }],
  prizes: [{ id: 'prize-1', name: 'Gift Card', quota: 1 }],
  design: {
    ...DEFAULT_DESIGN_DATA,
    background: { ...DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND }
  },
  visibility: { visibility: VisibilityType.UNLISTED, slug: null },
  criteria: {
    minTasksCompleted: DEFAULT_MIN_TASK_COMPLETED,
    minQualityScore: DEFAULT_MIN_QUALITY_SCORE,
    allowMultipleWins: DEFAULT_ALLOW_MULTIPLE_WINS,
    allowUserSelection: DEFAULT_ALLOW_USER_SELECTION
  },
  ...overrides
});

export const buildLayout = (
  overrides: Partial<LayoutValue> = {}
): LayoutValue => ({
  id: 'sweepstakes-1',
  title: 'Summer Giveaway',
  type: 'sweepstake',
  disabled: false,
  integrations: [],
  currentStep: 'setup',
  isLoadingLayout: false,
  mobile: false,
  setCurrentStep: () => {},
  setShowIssues: () => {},
  onCancel: () => {},
  onJumpToField: () => {},
  onSave: () => {},
  showIssues: false,
  action: 'create',
  stepErrors: {},
  formErrors: [],
  stepLabels: {},
  stepOrder: [],
  stepsToFields: {},
  fieldsToSteps: {},
  hasErrors: false,
  banner: null,
  ...overrides
});

export type FormHarnessOptions = {
  values?: GiveawayFormSchema;
  validate?: boolean;
  layout?: Partial<LayoutValue>;
};

type FormChildren = React.ReactNode | ((form: GiveawayForm) => React.ReactNode);

type FormHarnessProps = FormHarnessOptions & {
  onReady: (form: GiveawayForm) => void;
  children: FormChildren;
};

const FormHarness = ({
  values,
  validate = false,
  layout,
  onReady,
  children
}: FormHarnessProps) => {
  const form = useForm<GiveawayFormSchema>({
    defaultValues: values ?? buildFormValues(),
    mode: 'onChange',
    resolver: validate
      ? zodResolver(giveawayFormSchema({ validate: false, maxLoyalty: 0 }))
      : undefined
  });

  useEffect(() => {
    onReady(form);
  }, [form, onReady]);

  return (
    <UnifiedFormLayoutContext.Provider value={buildLayout(layout)}>
      <FormProvider {...form}>
        {typeof children === 'function' ? children(form) : children}
      </FormProvider>
    </UnifiedFormLayoutContext.Provider>
  );
};

export const renderWithForm = (
  ui: FormChildren,
  options: FormHarnessOptions = {}
): RenderResult & { form: GiveawayForm } => {
  const holder: { form?: GiveawayForm } = {};
  const view = render(
    <FormHarness
      {...options}
      onReady={(form) => {
        holder.form = form;
      }}
    >
      {ui}
    </FormHarness>
  );
  if (!holder.form) {
    throw new Error('The form harness did not initialise');
  }
  return { ...view, form: holder.form };
};
