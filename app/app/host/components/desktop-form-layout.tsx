import { SiteHeader } from '@/components/patterns/app-sidebar/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/components/ui/resizble';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XIcon, SaveIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface DesktopFormLayoutProps {
  title: string;
  onSubmit: () => void;
  disabled: boolean;
  left: React.ReactNode;
  right: React.ReactNode;
}

const DesktopFormHeader: React.FC<{
  title: string;
  disabled: boolean;
}> = ({ title, disabled }) => {
  const searchParams = useSearchParams();
  const step = searchParams.get('step') ?? 'setup';

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
        
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 min-h-0"
        >
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