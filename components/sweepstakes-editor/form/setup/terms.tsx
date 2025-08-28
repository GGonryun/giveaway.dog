'use client';

import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Typography } from '@/components/ui/typography';
import { widetype } from '@/lib/widetype';
import { cn } from '@/lib/utils';

import { stringifyTerms } from '../terms';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

type TermsAndConditionsType = 'default' | 'custom';
const OPTIONS: Record<TermsAndConditionsType, string> = {
  default: 'Default',
  custom: 'Custom'
};
export const TermsAndConditions = () => {
  const [type, setType] = useState<TermsAndConditionsType>('default');
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name="terms"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Terms & Conditions</FormLabel>

          <FormControl>
            <div className="space-y-2">
              <div className="flex gap-2">
                {widetype.entries(OPTIONS).map(([key, label]) => (
                  <Button
                    type="button"
                    className="flex flex-col justify-start items-start text-left grow"
                    variant={key === type ? 'default' : 'outline'}
                    key={key}
                    onClick={() => {
                      setType(key);
                    }}
                  >
                    <div className="flex justify-between items-center w-full">
                      <Typography.Paragraph weight="semibold">
                        {label}
                      </Typography.Paragraph>
                      <RadioIcon checked={type === key} />
                    </div>
                  </Button>
                ))}
              </div>
              {type === 'default' ? (
                <ButtonTextarea />
              ) : (
                <Textarea rows={12} placeholder={stringifyTerms()} {...field} />
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const RadioIcon: React.FC<{ checked: boolean }> = ({ checked }) => {
  return (
    <div
      className={cn(
        'w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center',
        checked && 'border-primary-foreground '
      )}
    >
      {checked && (
        <div className="w-2.5 h-2.5 bg-primary-foreground rounded-full" />
      )}
    </div>
  );
};

const ButtonTextarea = () => {
  return (
    <div className="relative w-full">
      <Textarea placeholder={stringifyTerms()} rows={12} />

      <Dialog>
        <DialogTrigger asChild>
          <div
            className="absolute border inset-0 bg-white/60 backdrop-blur-[1px] opacity-100 lg:opacity-0 hover:opacity-100 transition-opacity rounded-md flex items-center justify-center cursor-pointer"
            onClick={() => {}}
          >
            <Button type="button">
              <Settings2 />
              Modify
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="w-screen md:w-[90vw] max-w-7xl h-[95vh]">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};
