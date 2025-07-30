import {
  ErrorMessage,
  useFormErrors
} from '@/components/hooks/use-form-errors';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { ChevronsUpDownIcon, CircleAlertIcon } from 'lucide-react';
import React, { useEffect, useMemo } from 'react';
import { FieldPath, FieldValues, useFormContext } from 'react-hook-form';

export function Section<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
>({
  children,
  fields,
  ...props
}: Omit<SectionTitleProps, 'icon'> & {
  fields?: TName[];
  children: React.ReactNode | React.ReactNode[];
}) {
  const [open, setOpen] = React.useState(true);
  const form = useFormContext<TFieldValues>();
  const errors = useFormErrors(form.formState.errors, fields ?? []);

  const invalid = useMemo(() => {
    return errors.length > 0;
  }, [errors]);

  useEffect(() => {
    if (invalid) setOpen(true);
  }, [invalid]);

  return (
    <Collapsible
      className={cn(
        'border shadow-sm overflow-hidden rounded-lg bg-background',
        invalid ? 'border-red-500' : ''
      )}
      open={open}
      onOpenChange={setOpen}
    >
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between  p-4 cursor-pointer">
          <div className="flex flex-col gap-2 w-full">
            <SectionTitle
              {...props}
              icon={
                invalid ? (
                  <CircleAlertIcon className="text-red-500" />
                ) : (
                  <ChevronsUpDownIcon />
                )
              }
            />
            {!open && <ErrorMessages errors={errors} />}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent asChild>
        <div className="flex flex-col gap-2 p-4 border-t">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

type SectionTitleProps = {
  label: string;
  description: string;
  icon: React.ReactNode;
};
const SectionTitle: React.FC<SectionTitleProps> = ({
  icon,
  label,
  description
}) => {
  return (
    <div className="flex justify-between items-center flex-grow">
      <div className="flex flex-col">
        <Typography.H2>{label}</Typography.H2>
        <Typography.Paragraph color="muted">{description}</Typography.Paragraph>
      </div>
      {icon}
    </div>
  );
};

const ErrorMessages = ({ errors }: { errors: ErrorMessage[] }) => {
  if (!errors.length) return null;

  return (
    <div className="space-y-1">
      {errors.map((e) => (
        <Typography.Paragraph key={e.path} color="destructive">
          {e.message}
        </Typography.Paragraph>
      ))}
    </div>
  );
};
