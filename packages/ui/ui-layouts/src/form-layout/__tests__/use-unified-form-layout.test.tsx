import {
  render,
  renderHook,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { FieldPath, FormProvider, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import z from 'zod';
import {
  UnifiedFormLayoutContextProps,
  UnifiedFormLayoutContextProvider,
  useUnifiedFormLayout
} from '../use-unified-form-layout';

const mocks = vi.hoisted(() => ({
  viewport: { isTablet: false, isLoading: false },
  toastError: vi.fn(),
  onCancel: vi.fn(),
  onSave: vi.fn(),
  setShowIssues: vi.fn()
}));

vi.mock('@giveaway/ui-hooks/use-tablet', () => ({
  useIsTablet: () => mocks.viewport
}));

vi.mock('sonner', () => ({
  toast: { error: mocks.toastError, success: vi.fn() }
}));

type Step = 'details' | 'prizes' | 'tasks';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  prizes: z.array(
    z.object({ name: z.string().min(1, 'Prize name is required') })
  ),
  tasks: z.string().min(1, 'Add a task')
});

type Values = z.infer<typeof schema>;

type HarnessProps = Partial<UnifiedFormLayoutContextProps<Step>> & {
  values?: Partial<Values>;
  initialErrors?: Record<string, string>;
};

const Harness = ({ values, initialErrors, ...props }: HarnessProps) => {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: 'Summer Giveaway',
      prizes: [{ name: 'Gift card' }],
      tasks: 'Follow us',
      ...values
    }
  });
  const [showIssues, setShowIssues] = useState(false);

  useEffect(() => {
    Object.entries(initialErrors ?? {}).forEach(([name, message]) =>
      form.setError(name as FieldPath<Values>, { type: 'custom', message })
    );
  }, [form, initialErrors]);

  return (
    <FormProvider {...form}>
      <UnifiedFormLayoutContextProvider<Step>
        id="sweepstakes-1"
        integrations={[]}
        title="Summer Giveaway"
        type="sweepstake"
        disabled={false}
        action="edit"
        defaultStep="details"
        stepOrder={['details', 'prizes', 'tasks']}
        stepLabels={{ details: 'Details', prizes: 'Prizes', tasks: 'Tasks' }}
        stepsToFields={{
          details: ['title'],
          prizes: ['prizes'],
          tasks: ['tasks']
        }}
        fieldsToSteps={{ title: 'details', prizes: 'prizes', tasks: 'tasks' }}
        onCancel={mocks.onCancel}
        onSave={mocks.onSave}
        showIssues={showIssues}
        setShowIssues={(show) => {
          mocks.setShowIssues(show);
          setShowIssues(show);
        }}
        form={<div>Form body</div>}
        preview={<div>Preview body</div>}
        previewFooter={null}
        {...props}
      />
    </FormProvider>
  );
};

const tab = (name: string) =>
  screen.getByRole('tab', { name: new RegExp(name) });

const expectSelectedStep = (name: string) =>
  expect(tab(name)).toHaveAttribute('aria-selected', 'true');

const errorBadge = (name: string) => within(tab(name)).queryByText(/^\d+$/);

const openIssues = async (label: string) => {
  await userEvent.click(screen.getByRole('button', { name: label }));
  return within(
    screen.getByRole('dialog', { name: 'There are some problems' })
  );
};

describe('useUnifiedFormLayout', () => {
  it('returns the default layout state outside a provider instead of throwing', () => {
    const { result } = renderHook(() => useUnifiedFormLayout());
    expect(result.current.title).toBe('');
    expect(result.current.type).toBe('sweepstake');
    expect(result.current.action).toBe('create');
    expect(result.current.stepOrder).toEqual([]);
    expect(result.current.mobile).toBe(false);
  });
});

describe('UnifiedFormLayoutContextProvider', () => {
  const cancelNavigation = (event: MouseEvent) => event.preventDefault();

  beforeEach(() => {
    mocks.viewport.isTablet = false;
    mocks.viewport.isLoading = false;
    mocks.toastError.mockReset();
    mocks.onCancel.mockReset();
    mocks.onSave.mockReset();
    mocks.setShowIssues.mockReset();
    document.addEventListener('click', cancelNavigation);
  });

  afterEach(() => {
    document.removeEventListener('click', cancelNavigation);
    window.history.replaceState({}, '', '/');
  });

  describe('layout', () => {
    it('starts on the default step in the desktop layout', () => {
      render(<Harness />);
      expect(
        screen.getByRole('heading', { level: 1, name: 'Summer Giveaway' })
      ).toBeInTheDocument();
      expectSelectedStep('Details');
      expect(
        screen.getByRole('button', { name: 'Save Changes' })
      ).toBeInTheDocument();
    });

    it('starts on a custom default step', () => {
      render(<Harness defaultStep="tasks" />);
      expectSelectedStep('Tasks');
    });

    it('shows a spinner until the screen size is known', () => {
      mocks.viewport.isLoading = true;
      const { container } = render(<Harness />);
      expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
      expect(screen.queryByText('Form body')).not.toBeInTheDocument();
    });

    it('uses the mobile layout on smaller screens', () => {
      mocks.viewport.isTablet = true;
      render(<Harness />);
      expect(
        screen.getByRole('button', { name: 'Preview' })
      ).toBeInTheDocument();
    });

    it('cancels through the provided handler', async () => {
      render(<Harness />);
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(mocks.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('step navigation', () => {
    it('moves to the chosen step and records it in the URL', async () => {
      render(<Harness />);
      await userEvent.click(tab('Prizes'));
      expectSelectedStep('Prizes');
      expect(window.location.search).toBe('?step=prizes');
    });

    it('moves to the next step from the footer', async () => {
      render(<Harness />);
      await userEvent.click(screen.getByRole('button', { name: 'Next' }));
      expectSelectedStep('Prizes');
    });

    it('validates the fields of the step being left', async () => {
      render(<Harness values={{ title: '' }} />);
      expect(errorBadge('Details')).not.toBeInTheDocument();

      await userEvent.click(tab('Prizes'));

      await waitFor(() => expect(errorBadge('Details')).toHaveTextContent('1'));
      expect(
        screen.getByRole('button', { name: '1 Issue' })
      ).toBeInTheDocument();
    });

    it('validates nested fields of the step being left', async () => {
      render(
        <Harness defaultStep="prizes" values={{ prizes: [{ name: '' }] }} />
      );
      await userEvent.click(tab('Tasks'));
      await waitFor(() => expect(errorBadge('Prizes')).toHaveTextContent('1'));
    });

    it('validates the default step rather than the step being left after the first move', async () => {
      render(<Harness values={{ prizes: [{ name: '' }] }} />);
      await userEvent.click(tab('Prizes'));
      await userEvent.click(tab('Tasks'));

      expectSelectedStep('Tasks');
      await waitFor(() =>
        expect(
          screen.queryByRole('button', { name: /Issue/ })
        ).not.toBeInTheDocument()
      );
      expect(errorBadge('Prizes')).not.toBeInTheDocument();
    });
  });

  describe('errors', () => {
    it('counts each error on the step that owns the field', async () => {
      render(
        <Harness
          initialErrors={{
            'prizes.0.name': 'Prize name is required',
            tasks: 'Add a task'
          }}
        />
      );
      await waitFor(() => expect(errorBadge('Prizes')).toHaveTextContent('1'));
      expect(errorBadge('Tasks')).toHaveTextContent('1');
      expect(errorBadge('Details')).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '2 Issues' })
      ).toBeInTheDocument();
    });

    it('marks the save button as destructive when a step has errors', async () => {
      render(<Harness initialErrors={{ tasks: 'Add a task' }} />);
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Save Changes' })
        ).toHaveClass('bg-destructive')
      );
    });

    it('lists errors for fields outside every step without counting them on a step', async () => {
      render(<Harness initialErrors={{ legacyField: 'Unsupported field' }} />);
      expect(
        await screen.findByRole('button', { name: '1 Issue' })
      ).toBeInTheDocument();
      ['Details', 'Prizes', 'Tasks'].forEach((name) =>
        expect(errorBadge(name)).not.toBeInTheDocument()
      );
      expect(
        screen.getByRole('button', { name: 'Save Changes' })
      ).not.toHaveClass('bg-destructive');
    });
  });

  describe('issues dialog', () => {
    it('jumps to the step of the chosen issue and closes the dialog', async () => {
      render(
        <Harness
          values={{ tasks: '' }}
          initialErrors={{ tasks: 'Add a task' }}
        />
      );
      await screen.findByRole('button', { name: '1 Issue' });
      const issues = await openIssues('1 Issue');

      await userEvent.click(
        issues.getByRole('button', { name: 'tasks Add a task' })
      );

      await waitFor(() => expectSelectedStep('Tasks'));
      expect(mocks.setShowIssues).toHaveBeenLastCalledWith(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('warns about an issue that does not belong to any step', async () => {
      render(<Harness initialErrors={{ legacyField: 'Unsupported field' }} />);
      await screen.findByRole('button', { name: '1 Issue' });
      const issues = await openIssues('1 Issue');

      await userEvent.click(
        issues.getByRole('button', { name: 'legacyField Unsupported field' })
      );

      expect(mocks.toastError).toHaveBeenCalledWith('Invalid field path');
      expect(window.location.search).toBe('');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('saves and exits through the provided handler when creating', async () => {
      render(
        <Harness action="create" initialErrors={{ tasks: 'Add a task' }} />
      );
      await screen.findByRole('button', { name: '1 Issue' });
      const issues = await openIssues('1 Issue');

      await userEvent.click(
        issues.getByRole('button', { name: 'Save & Exit' })
      );

      expect(mocks.onSave).toHaveBeenCalledTimes(1);
    });
  });
});
