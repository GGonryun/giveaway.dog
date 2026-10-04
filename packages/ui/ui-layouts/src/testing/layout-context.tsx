import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { UnifiedFormLayoutContext } from '../form-layout/use-unified-form-layout';

export type LayoutContextValue = React.ContextType<
  typeof UnifiedFormLayoutContext
>;

export const createLayoutContext = (
  overrides: Partial<LayoutContextValue> = {}
): LayoutContextValue => ({
  id: 'sweepstakes-1',
  integrations: [],
  title: 'Summer Giveaway',
  type: 'sweepstake',
  disabled: false,
  currentStep: 'details',
  action: 'create',
  stepOrder: ['details', 'prizes', 'tasks'],
  stepsToFields: {
    details: ['title'],
    prizes: ['prizes'],
    tasks: ['tasks']
  },
  fieldsToSteps: { title: 'details', prizes: 'prizes', tasks: 'tasks' },
  stepLabels: { details: 'Details', prizes: 'Prizes', tasks: 'Tasks' },
  onCancel: vi.fn(),
  onSave: vi.fn(),
  banner: null,
  showIssues: false,
  setShowIssues: vi.fn(),
  isLoadingLayout: false,
  mobile: false,
  stepErrors: { details: 0, prizes: 0, tasks: 0 },
  hasErrors: false,
  formErrors: [],
  setCurrentStep: vi.fn(),
  onJumpToField: vi.fn(),
  ...overrides
});

export const LayoutProvider: React.FC<{
  value: LayoutContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <UnifiedFormLayoutContext.Provider value={value}>
    {children}
  </UnifiedFormLayoutContext.Provider>
);

export const renderWithLayout = (
  ui: React.ReactElement,
  overrides: Partial<LayoutContextValue> = {}
) => {
  const context = createLayoutContext(overrides);
  const view = render(<LayoutProvider value={context}>{ui}</LayoutProvider>);
  const rerenderWithLayout = (
    nextOverrides: Partial<LayoutContextValue> = {}
  ) =>
    view.rerender(
      <LayoutProvider value={{ ...context, ...nextOverrides }}>
        {ui}
      </LayoutProvider>
    );
  return { ...view, context, rerenderWithLayout };
};
