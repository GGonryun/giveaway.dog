import { SiteHeader } from '@/components/patterns/app-sidebar/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { XIcon, SaveIcon, EyeIcon, EditIcon, AlertCircleIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useFormErrors } from '@/components/hooks/use-form-errors';
import { useIncompleteFields } from '@/components/hooks/use-incomplete-fields';

interface MobileFormLayoutProps {
  title: string;
  onSubmit: () => void;
  disabled: boolean;
  left: React.ReactNode;
  right: React.ReactNode;
}

const MobileTabTrigger: React.FC<{
  value: string;
  label: string;
  errors: number;
  mobileView: 'form' | 'preview';
}> = ({ value, label, errors, mobileView }) => {
  return (
    <TabsTrigger asChild value={value} className="flex-1">
      <Link
        href={`?step=${value}`}
        className={cn(
          'flex gap-1 w-full data-[state=active]:border-l data-[state=active]:border-t data-[state=active]:border-r h-7 mt-1',
          mobileView === 'preview' && 'data-[state=active]:bg-tertiary-10'
        )}
      >
        {label}
        {Boolean(errors) && (
          <Badge
            variant="destructive"
            className="text-xs h-4 w-4 p-0 m-0 leading-none"
          >
            {errors}
          </Badge>
        )}
      </Link>
    </TabsTrigger>
  );
};

const MobileFormHeader: React.FC<{
  title: string;
  disabled: boolean;
  mobileView: 'form' | 'preview';
}> = ({ title, disabled, mobileView }) => {
  const searchParams = useSearchParams();
  const step = searchParams.get('step') ?? 'setup';

  return (
    <SiteHeader className="h-20">
      <div className="flex flex-col w-full gap-2 pt-1">
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-medium truncate">{title}</h1>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              onClick={() => alert('Cancel clicked')}
            >
              <XIcon />
            </Button>
            <Button
              type="submit"
              size="icon"
              disabled={disabled}
              onClick={() => alert('Publish clicked')}
            >
              <SaveIcon />
            </Button>
          </div>
        </div>
        <div className="w-full">
          <Tabs value={step}>
            <TabsList size="sm" className="w-full px-1 gap-1 m-0 h-8">
              <MobileTabTrigger
                value="setup"
                label="Setup"
                errors={0}
                mobileView={mobileView}
              />
              <MobileTabTrigger
                value="audience"
                label="Audience"
                errors={0}
                mobileView={mobileView}
              />
              <MobileTabTrigger
                value="tasks"
                label="Tasks"
                errors={0}
                mobileView={mobileView}
              />
              <MobileTabTrigger
                value="prizes"
                label="Prizes"
                errors={0}
                mobileView={mobileView}
              />
            </TabsList>
          </Tabs>
        </div>
      </div>
    </SiteHeader>
  );
};

const MobileFieldIssuesDialog: React.FC<{
  errors: any[];
  incompleteFields: any[];
}> = ({ errors, incompleteFields }) => {
  const router = useRouter();
  
  const handleJumpToField = (fieldPath: string) => {
    // Extract the section from the field path
    const section = fieldPath.split('.')[0];
    const sectionMap: Record<string, string> = {
      'setup': 'setup',
      'audience': 'audience', 
      'tasks': 'tasks',
      'prizes': 'prizes'
    };
    
    if (sectionMap[section]) {
      router.push(`?step=${sectionMap[section]}`);
    }
  };

  return (
    <DialogContent className="max-w-sm mx-2">
      <DialogHeader>
        <DialogTitle>Field Issues</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {errors.length > 0 && (
          <div>
            <h4 className="font-medium text-destructive mb-2">Validation Errors</h4>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <button
                  key={index}
                  onClick={() => handleJumpToField(error.path)}
                  className="w-full text-left p-2 border rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-sm">{error.path}</div>
                  <div className="text-xs text-muted-foreground">{error.message}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {incompleteFields.length > 0 && (
          <div>
            <h4 className="font-medium text-amber-600 mb-2">Incomplete Fields</h4>
            <div className="space-y-2">
              {incompleteFields.map((field, index) => (
                <button
                  key={index}
                  onClick={() => handleJumpToField(field.path)}
                  className="w-full text-left p-2 border rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-sm">{field.path}</div>
                  <div className="text-xs text-muted-foreground">This field is empty</div>
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
  
  const currentStepField = currentStep === 'tasks' ? 'tasks' : currentStep === 'audience' ? 'audience' : currentStep === 'prizes' ? 'prizes' : 'setup';
  const allFormValues = watch();
  
  const formErrors = useFormErrors(errors, [currentStepField]);
  const incompleteFields = useIncompleteFields(allFormValues, [currentStepField]);
  
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
              className="flex items-center gap-1"
            >
              <AlertCircleIcon className="h-4 w-4" />
              {totalIssues > 0 ? totalIssues : '✓'}
            </Button>
          </DialogTrigger>
          <MobileFieldIssuesDialog errors={formErrors} incompleteFields={incompleteFields} />
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
          </Button>
          <Button 
            type="button"
            variant={isCurrentStepValid ? "default" : "outline"}
            size="sm"
            onClick={handleNext}
            disabled={!hasNextStep}
          >
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

const MobileViewToggle: React.FC<{
  mobileView: 'form' | 'preview';
  onMobileViewChange: (view: 'form' | 'preview') => void;
}> = ({ mobileView, onMobileViewChange }) => {
  return (
    <div className="bg-background border-t p-2">
      <div className="flex bg-muted rounded-lg p-1 w-full gap-2">
        <Button
          type="button"
          variant={mobileView === 'form' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onMobileViewChange('form')}
          className="flex-1"
        >
          <EditIcon className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          type="button"
          variant={mobileView === 'preview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onMobileViewChange('preview')}
          className="flex-1"
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </div>
    </div>
  );
};

export const MobileFormLayout: React.FC<MobileFormLayoutProps> = ({
  title,
  onSubmit,
  disabled,
  left,
  right
}) => {
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <form
        onSubmit={onSubmit}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <MobileFormHeader
          title={title}
          disabled={disabled}
          mobileView={mobileView}
        />

        <div className="bg-background flex-1 min-h-0 overflow-hidden relative top-0 z-10 flex flex-col">
          {mobileView === 'form' ? (
            <>
              <div className="overflow-y-scroll flex-1">{left}</div>
              <FormFooter />
            </>
          ) : (
            <>
              <div className="overflow-hidden w-full flex-1 flex items-center justify-center bg-tertiary-10">
                {right}
              </div>
              <PreviewFooter />
            </>
          )}
          <MobileViewToggle
            mobileView={mobileView}
            onMobileViewChange={setMobileView}
          />
        </div>
      </form>
    </div>
  );
};
