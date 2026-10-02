import { cn } from '@/lib/utils';
import React from 'react';

type UnifiedSectionHeaderProps = Omit<SectionTitleProps, 'icon'> & {
  children: React.ReactNode | React.ReactNode[];
  className?: string;
};

export const UnifiedSectionHeader: React.FC<UnifiedSectionHeaderProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div>
      <div
        className={cn(
          'sticky top-0 z-10 bg-background flex items-center justify-between p-2 sm:p-4 border-b',
          className
        )}
      >
        <div className="flex flex-col gap-2 w-full">
          <SectionTitle {...props} />
        </div>
      </div>
      <div className="flex flex-col gap-2 p-2 sm:p-4">{children}</div>
    </div>
  );
};

type SectionTitleProps = {
  label: string;
  description: string;
};
const SectionTitle: React.FC<SectionTitleProps> = ({ label, description }) => {
  return (
    <div className="flex justify-between items-center grow">
      <div className="flex flex-col">
        <h2 className="text-lg sm:text-xl font-semibold">{label}</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
};
