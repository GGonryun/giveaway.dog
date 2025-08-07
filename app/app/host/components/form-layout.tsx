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
import { useRouter, useSearchParams } from 'next/navigation';

interface FormLayoutProps {
  title: string;
  onSubmit: () => void;
  disabled: boolean;
  leftSide: React.ReactNode;
  rightSide: React.ReactNode;
}

export const FormLayout: React.FC<FormLayoutProps> = ({
  title,
  onSubmit,
  disabled,
  leftSide,
  rightSide
}) => {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <form
        onSubmit={onSubmit}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <FormHeader title={title} disabled={disabled} />
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          <ResizablePanel defaultSize={30} className="min-w-[500px]">
            <div className="px-2 py-4 space-y-2 overflow-y-scroll pr-4 h-full">
              {leftSide}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={55}>
            <div className="overflow-hidden w-full h-full flex items-center justify-center bg-primary/10">
              {rightSide}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
        <FormFooter />
      </form>
    </div>
  );
};
const FormHeader: React.FC<{ title: string; disabled: boolean }> = ({
  title,
  disabled
}) => {
  const searchParams = useSearchParams();
  const step = searchParams.get('step') ?? 'setup';

  return (
    <SiteHeader>
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg sm:text-xl font-medium">{title}</h1>
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
            <TabsTrigger asChild value="timing">
              <Link href="?step=timing">Timing</Link>
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
        <div className="flex gap-2">
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
    <div className="sticky bottom-0 bg-background border-t p-4">
      TODO: buttons
    </div>
  );
};
