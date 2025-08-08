import { SiteHeader } from '@/components/patterns/app-sidebar/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizable';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  XIcon,
  SaveIcon,
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFormContext } from 'react-hook-form';
import { useFormErrors } from '@/components/hooks/use-form-errors';
import { useIncompleteFields } from '@/components/hooks/use-incomplete-fields';
import { useState } from 'react';
import { useMediaQuery } from '@/components/hooks/use-media-query';

interface DesktopFormLayoutProps {
  title: string;
  onSubmit: () => void;
  disabled: boolean;
  left: React.ReactNode;
  right: React.ReactNode;
}

const DesktopTabs: React.FC<{ step: string }> = ({ step }) => {
  return (
    <div className="flex-1 flex justify-center">
      <Tabs value={step}>
        <TabsList size="default">
          <TabsTrigger asChild value="setup">
            <Link href="?step=setup" className="flex gap-1">
              Setup
              <Badge variant="destructive" className="px-1 py-0.5 leading-none">
                0
              </Badge>
            </Link>
          </TabsTrigger>
          <TabsTrigger asChild value="audience">
            <Link href="?step=audience">Audience</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="tasks">
            <Link href="?step=tasks">Tasks</Link>
          </TabsTrigger>
          <TabsTrigger asChild value="prizes">
            <Link href="?step=prizes">Prizes</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

const DesktopTitle: React.FC<{ title: React.ReactNode }> = ({ title }) => {
  return (
    <div className="flex-1">
      <h1 className="text-lg sm:text-xl font-medium">{title}</h1>
    </div>
  );
};

const DesktopActions: React.FC<{ disabled: boolean }> = ({ disabled }) => {
  return (
    <div className="flex-1 flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="default"
        disabled={disabled}
      >
        <XIcon />
        Cancel
      </Button>
      <Button type="submit" size="default" disabled={disabled}>
        <SaveIcon />
        Publish
      </Button>
    </div>
  );
};

const DesktopFormHeader: React.FC<{
  title: string;
  disabled: boolean;
}> = ({ title, disabled }) => {
  const searchParams = useSearchParams();
  const step = searchParams.get('step') ?? 'setup';
  const isLarge = useMediaQuery('(min-width: 1024px)');

  return (
    <SiteHeader>
      <div className="flex items-center w-full">
        <DesktopTitle title={title} />
        {isLarge && <DesktopTabs step={step} />}
        <DesktopActions disabled={disabled} />
      </div>
    </SiteHeader>
  );
};

const FieldIssuesDialog: React.FC<{
  errors: any[];
  incompleteFields: any[];
}> = ({ errors, incompleteFields }) => {
  const router = useRouter();

  const handleJumpToField = (fieldPath: string) => {
    // Extract the section from the field path
    const section = fieldPath.split('.')[0];
    const sectionMap: Record<string, string> = {
      setup: 'setup',
      audience: 'audience',
      tasks: 'tasks',
      prizes: 'prizes'
    };

    if (sectionMap[section]) {
      router.push(`?step=${sectionMap[section]}`);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Field Issues</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {errors.length > 0 && (
          <div>
            <h4 className="font-medium text-destructive mb-2">
              Validation Errors
            </h4>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <button
                  key={index}
                  onClick={() => handleJumpToField(error.path)}
                  className="w-full text-left p-2 border rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-sm">{error.path}</div>
                  <div className="text-xs text-muted-foreground">
                    {error.message}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {incompleteFields.length > 0 && (
          <div>
            <h4 className="font-medium text-amber-600 mb-2">
              Incomplete Fields
            </h4>
            <div className="space-y-2">
              {incompleteFields.map((field, index) => (
                <button
                  key={index}
                  onClick={() => handleJumpToField(field.path)}
                  className="w-full text-left p-2 border rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-sm">{field.path}</div>
                  <div className="text-xs text-muted-foreground">
                    This field is empty
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {errors.length === 0 && incompleteFields.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            All fields are complete and valid!
          </div>
        )}
      </div>
    </DialogContent>
  );
};

const FormFooter: React.FC = () => {
  const { formState, watch } = useFormContext();
  const { errors } = formState;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const currentStep = searchParams.get('step') ?? 'setup';
  const steps = ['setup', 'audience', 'tasks', 'prizes'];
  const currentStepIndex = steps.indexOf(currentStep);

  const currentStepField =
    currentStep === 'tasks'
      ? 'tasks'
      : currentStep === 'audience'
        ? 'audience'
        : currentStep === 'prizes'
          ? 'prizes'
          : 'setup';
  const allFormValues = watch();

  const formErrors = useFormErrors(errors, [currentStepField]);
  const incompleteFields = useIncompleteFields(allFormValues, [
    currentStepField
  ]);

  const totalIssues = formErrors.length + incompleteFields.length;
  const hasNextStep = currentStepIndex < steps.length - 1;
  const hasPreviousStep = currentStepIndex > 0;

  const isCurrentStepValid = formErrors.length === 0;

  const handleNext = () => {
    if (hasNextStep) {
      router.push(`?step=${steps[currentStepIndex + 1]}`);
    }
  };

  const handlePrevious = () => {
    if (hasPreviousStep) {
      router.push(`?step=${steps[currentStepIndex - 1]}`);
    }
  };

  return (
    <div className="bg-background border-t p-3">
      <div className="flex justify-between items-center">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <AlertCircleIcon className="h-4 w-4" />
              {totalIssues > 0
                ? `${totalIssues} Issue${totalIssues === 1 ? '' : 's'}`
                : 'All Complete'}
            </Button>
          </DialogTrigger>
          <FieldIssuesDialog
            errors={formErrors}
            incompleteFields={incompleteFields}
          />
        </Dialog>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={!hasPreviousStep}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant={isCurrentStepValid ? 'default' : 'outline'}
            size="sm"
            onClick={handleNext}
            disabled={!hasNextStep}
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const PreviewFooter: React.FC = () => {
  return (
    <div className="bg-background border-t p-3">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">Preview Mode</div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm">
            Share Preview
          </Button>
          <Button type="button" variant="outline" size="sm">
            Test Giveaway
          </Button>
        </div>
      </div>
    </div>
  );
};

export const DesktopFormLayout: React.FC<DesktopFormLayoutProps> = ({
  title,
  onSubmit,
  disabled,
  left,
  right
}) => {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <form
        onSubmit={onSubmit}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <DesktopFormHeader title={title} disabled={disabled} />

        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          <ResizablePanel
            defaultSize={30}
            className="min-w-[300px] xl:max-w-[800px] flex flex-col"
          >
            <div className="space-y-2 overflow-y-scroll flex-1">{left}</div>
            <FormFooter />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={60}
            className="min-w-[500px] xl:min-w-[800px] flex flex-col"
          >
            <div className="overflow-hidden w-full flex-1 flex items-center justify-center bg-tertiary-10">
              {right}
            </div>
            <PreviewFooter />
          </ResizablePanel>
        </ResizablePanelGroup>
      </form>
    </div>
  );
};
