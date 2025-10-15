import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import React from 'react';
import { cn } from '@/lib/utils';
import { QUALITY_THEME, QualityType } from '@/schemas/quality';
import { ChevronDown, LucideIcon } from 'lucide-react';

export const MetricLayout: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  content: React.ReactNode;
  icon: React.ReactNode;
  badge: React.ReactNode;
}> = ({ open, onOpenChange, content: trigger, description, icon, badge }) => {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="rounded-lg border bg-card overflow-hidden focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] focus-within:outline-1"
    >
      <CollapsibleTrigger className="w-full outline-none cursor-pointer">
        <div className="flex items-center justify-between p-2 hover:bg-accent/50 transition-colors gap-3 ">
          <div className="flex items-center flex-1 gap-2">
            {icon}
            {trigger}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">{badge}</div>
            <ChevronDown
              className={cn(
                `h-4 w-4 transition-transform`,
                open ? 'rotate-180' : ''
              )}
            />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3 pt-0 border-t bg-muted/50">
          <p className="text-sm text-muted-foreground leading-relaxed pt-3">
            {description}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const MetricIcon: React.FC<{ type: QualityType; icon: LucideIcon }> = ({
  type,
  icon: Icon
}) => {
  const theme = QUALITY_THEME[type];
  return (
    <div className={cn('p-2 rounded-lg w-fit', theme.light)}>
      <Icon className={cn('h-6 w-6', theme.text)} />
    </div>
  );
};
