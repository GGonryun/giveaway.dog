import { SiteHeader } from '@/components/patterns/app-sidebar/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XIcon, SaveIcon, EyeIcon, EditIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MobileFormLayoutProps {
  title: string;
  onSubmit: () => void;
  disabled: boolean;
  left: React.ReactNode;
  right: React.ReactNode;
  mobileView: 'form' | 'preview';
  onMobileViewChange: (view: 'form' | 'preview') => void;
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

const FormFooter: React.FC = () => {
  return (
    <div className="bg-background border-t p-3">
      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" size="sm">
          Save Draft
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm">
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Publish
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
        <div className="text-sm text-muted-foreground">
          Preview Mode
        </div>
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
  right,
  mobileView,
  onMobileViewChange
}) => {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <form
        onSubmit={onSubmit}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <MobileFormHeader title={title} disabled={disabled} mobileView={mobileView} />
        
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
            onMobileViewChange={onMobileViewChange}
          />
        </div>
      </form>
    </div>
  );
};