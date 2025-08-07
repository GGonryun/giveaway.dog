import { useIsMobile } from '@/components/hooks/use-mobile';
import { SiteHeader } from '@/components/patterns/app-sidebar/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizble';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MobileSuspense } from '@/components/ui/mobile-suspense';
import { XIcon, SaveIcon, EyeIcon, EditIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FormLayoutProps {
  title: string;
  onSubmit: () => void;
  disabled: boolean;
  left: React.ReactNode;
  right: React.ReactNode;
}

export const FormLayout: React.FC<FormLayoutProps> = ({
  title,
  onSubmit,
  disabled,
  left,
  right
}) => {
  const { isMobile } = useIsMobile();
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');

  return (
    <MobileSuspense>
      <div className="fixed inset-0 flex flex-col bg-background">
        <form
          onSubmit={onSubmit}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <FormHeader
            title={title}
            disabled={disabled}
            mobileView={mobileView}
          />

          {isMobile ? (
            // Mobile layout: single panel with toggle
            <div className="bg-background flex-1 min-h-0 overflow-hidden relative top-0 z-10">
              {mobileView === 'form' ? (
                <div className="overflow-y-scroll h-full">{left}</div>
              ) : (
                <div className="overflow-hidden w-full h-full flex items-center justify-center bg-tertiary-10">
                  {right}
                </div>
              )}
            </div>
          ) : (
            // Desktop layout: resizable panels
            <ResizablePanelGroup
              direction="horizontal"
              className="flex-1 min-h-0"
            >
              <ResizablePanel
                defaultSize={30}
                className="min-w-[300px] xl:max-w-[800px]"
              >
                <div className="space-y-2 overflow-y-scroll h-full">{left}</div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel
                defaultSize={60}
                className="min-w-[500px] xl:min-w-[800px]"
              >
                <div className="overflow-hidden w-full h-full flex items-center justify-center bg-tertiary-10">
                  {right}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}

          <FormFooter
            isMobile={isMobile}
            mobileView={mobileView}
            onMobileViewChange={setMobileView}
          />
        </form>
      </div>
    </MobileSuspense>
  );
};

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

const FormHeader: React.FC<{
  title: string;
  disabled: boolean;
  mobileView: 'form' | 'preview';
}> = ({ title, disabled, mobileView }) => {
  const { isMobile } = useIsMobile();
  const searchParams = useSearchParams();
  const step = searchParams.get('step') ?? 'setup';

  if (isMobile) {
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
  }

  return (
    <SiteHeader>
      <div className="flex items-center w-full">
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl font-medium">{title}</h1>
        </div>
        <div className="flex-1 flex justify-center">
          <Tabs value={step}>
            <TabsList size="default">
              <TabsTrigger asChild value="setup">
                <Link href="?step=setup" className="flex gap-1">
                  Setup
                  <Badge
                    variant="destructive"
                    className="px-1 py-0.5 leading-none"
                  >
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
      </div>
    </SiteHeader>
  );
};

const FormFooter: React.FC<{
  isMobile?: boolean;
  mobileView?: 'form' | 'preview';
  onMobileViewChange?: (view: 'form' | 'preview') => void;
}> = ({ isMobile, mobileView, onMobileViewChange }) => {
  if (isMobile) {
    return (
      <div className="sticky bottom-0 bg-background border-t p-2">
        <div className="flex bg-muted rounded-lg p-1 w-full gap-2">
          <Button
            type="button"
            variant={mobileView === 'form' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onMobileViewChange?.('form')}
            className="flex-1"
          >
            <EditIcon className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            type="button"
            variant={mobileView === 'preview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onMobileViewChange?.('preview')}
            className="flex-1"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 bg-background border-t p-2 sm:p-4">
      {/* Desktop footer content if needed */}
    </div>
  );
};
