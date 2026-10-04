import React, { useState } from 'react';
import {
  FieldPath,
  FieldValues,
  UseFormReturn,
  useFormContext
} from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@giveaway/ui-primitives/form';

import {
  SwitchBox,
  SwitchFormHeader
} from '@giveaway/ui-layouts/form-layout/switch-form-header';
import { Switch } from '@giveaway/ui-primitives/switch';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@giveaway/ui-primitives/select';
import {
  DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND,
  DEFAULT_GRADIENT_DESIGN_BACKGROUND
} from '@/schemas/giveaway/defaults';
import { Input } from '@giveaway/ui-primitives/input';
import { assertNever } from '@giveaway/util-errors';
import { Button } from '@giveaway/ui-primitives/button';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@giveaway/ui-primitives/popover';
import { toGradient } from '@/schemas/color';
import { UnifiedSectionHeader } from '@giveaway/ui-layouts/form-layout/section-header';
import {
  GiveawayFormSchema,
  GradientBackgroundSchema
} from '@/schemas/giveaway/schemas';

export const Design = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <>
      <UnifiedSectionHeader
        label="Form Design"
        description="Customize the content and appearance of your sweepstakes form"
      >
        <DisplayNameField form={form} fieldPath="design.displayName" />
        <DisplayDescriptionField
          form={form}
          fieldPath="design.displayDescription"
        />
        <AspectRatioField form={form} fieldPath="design.aspectRatio" />
      </UnifiedSectionHeader>
      <UnifiedSectionHeader
        label="Layout"
        description="Choose the layout and background style for your giveaway"
        className="border-t"
      >
        <BackgroundColor form={form} fieldPath="design.background" />
        <BackgroundFields form={form} fieldPath="design" />
      </UnifiedSectionHeader>
    </>
  );
};

export const DisplayNameField = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Display Name"
              description="Whether to display the sweepstakes title."
              help={{
                title: 'Help: Display Name',
                content: (
                  <p>
                    Choose whether to display the title of your sweepstakes to
                    participants. Enabling this option helps reinforce your
                    brand and makes the giveaway more recognizable.
                  </p>
                )
              }}
            />
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};

export const DisplayDescriptionField = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Display Description"
              description="Whether to display the sweepstakes description."
              help={{
                title: 'Help: Display Description',
                content: (
                  <p>
                    Choose whether to display the description of your
                    sweepstakes to participants. Enabling this option provides
                    additional context and details about the giveaway, enhancing
                    participant engagement.
                  </p>
                )
              }}
            />
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};

export const BackgroundColor = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  return (
    <FormField
      control={form.control}
      name={fieldPath}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Background</FormLabel>
          <FormControl>
            <Select
              value={
                field.value.type ?? DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND.type
              }
              onValueChange={(type) => {
                if (type === 'color') {
                  field.onChange(DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND);
                } else if (type === 'gradient') {
                  field.onChange(DEFAULT_GRADIENT_DESIGN_BACKGROUND);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select background type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="color">Solid Color</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const BackgroundFields = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const backgroundType = form.watch(
    `${fieldPath}.background.type` as FieldPath<TFieldValues>
  );
  switch (backgroundType) {
    case 'color':
      return (
        <ColorPicker
          form={form}
          fieldPath={`${fieldPath}.background.color` as FieldPath<TFieldValues>}
        />
      );
    case 'gradient':
      return <GradientPicker form={form} fieldPath={fieldPath} />;
    default:
      throw assertNever(backgroundType);
  }
};

const ColorPicker = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const color = form.watch(fieldPath);
  const colorInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <FormField
      control={form.control}
      name={fieldPath}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Color</FormLabel>
          <FormControl>
            <div className="relative w-full">
              <div
                className="h-26 w-full rounded-md border cursor-pointer"
                style={{
                  backgroundColor:
                    color ?? DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND.color
                }}
              />
              <div
                className="absolute border inset-0 bg-white/60 backdrop-blur-[1px] opacity-100 lg:opacity-0 hover:opacity-100 transition-opacity rounded-md flex items-center justify-center cursor-pointer"
                onClick={() => colorInputRef.current?.click()}
              >
                <Button type="button">
                  <Settings2 />
                  Modify
                </Button>
              </div>
              <Input
                ref={colorInputRef}
                type="color"
                className="sr-only"
                value={
                  field.value ?? DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND.color
                }
                onChange={(e) => field.onChange(e.target.value)}
              />
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

const GradientPicker = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const gradient = form.watch(
    `${fieldPath}.background` as FieldPath<TFieldValues>
  ) as GradientBackgroundSchema;
  const [isOpen, setIsOpen] = useState(false);

  if (gradient.type !== 'gradient') return null;

  return (
    <div className="flex flex-col gap-2">
      <FormLabel>Gradient</FormLabel>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <div
              className="h-26 w-full rounded-md border cursor-pointer"
              style={{ background: toGradient(gradient) }}
            />
            <div className="absolute border inset-0 bg-white/60 backdrop-blur-[1px] opacity-100 lg:opacity-0 hover:opacity-100 transition-opacity rounded-md flex items-center justify-center cursor-pointer">
              <Button type="button">
                <Settings2 />
                Modify
              </Button>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 max-h-[600px] overflow-y-auto"
          align="start"
        >
          <div className="flex flex-col gap-4">
            <GradientDirectionField
              form={form}
              fieldPath={
                `${fieldPath}.background.format` as FieldPath<TFieldValues>
              }
            />
            <GradientAngleField form={form} fieldPath={fieldPath} />
            <GradientStopsField form={form} fieldPath={fieldPath} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const GradientDirectionField = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  return (
    <FormField
      control={form.control}
      name={fieldPath}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Type</FormLabel>
          <FormControl>
            <div className="flex items-center border rounded-md overflow-hidden h-10 bg-background">
              <button
                type="button"
                onClick={() => field.onChange('linear')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  field.value === 'linear'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                Linear
              </button>
              <div className="h-6 w-px bg-border" />
              <button
                type="button"
                onClick={() => field.onChange('radial')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  field.value === 'radial'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                Radial
              </button>
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

const GradientAngleField = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const direction = form.watch(
    `${fieldPath}.background.format` as FieldPath<TFieldValues>
  );

  if (direction !== 'linear') return null;

  return (
    <FormField
      control={form.control}
      name={`${fieldPath}.background.angle` as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Angle</FormLabel>
          <FormControl>
            <div className="flex items-center gap-4">
              <AngleSelector value={field.value} onChange={field.onChange} />
              <Input
                type="number"
                min="0"
                max="360"
                value={field.value}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  field.onChange(Math.max(0, Math.min(360, val)));
                }}
                className="w-20"
              />
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

const AngleSelector = ({
  value,
  onChange
}: {
  value: number;
  onChange: (value: number) => void;
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    const angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    onChange(Math.round(angle < 0 ? angle + 360 : angle));
  };

  const radians = ((value - 90) * Math.PI) / 180;
  const radius = 35;
  const x = Math.cos(radians) * radius + 50;
  const y = Math.sin(radians) * radius + 50;

  return (
    <div
      className="relative w-10 h-10 rounded-full border-2 border-border bg-background cursor-pointer"
      onClick={handleClick}
    >
      <div
        className="absolute w-2.5 h-2.5 rounded-full bg-primary"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)'
        }}
      />
    </div>
  );
};

const GradientStopsField = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const gradient = form.watch(
    `${fieldPath}.background` as FieldPath<TFieldValues>
  ) as GradientBackgroundSchema;

  if (gradient.type !== 'gradient') return null;

  const addStop = () => {
    const stops = gradient.stops;
    const newPosition =
      stops.length > 0
        ? Math.min(stops[stops.length - 1].position + 10, 100)
        : 0;
    form.setValue(
      `${fieldPath}.background.stops` as FieldPath<TFieldValues>,
      [...stops, { color: '#000000', position: newPosition }] as any
    );
  };

  const removeStop = (index: number) => {
    const stops = gradient.stops.filter((_, i) => i !== index);
    form.setValue(
      `${fieldPath}.background.stops` as FieldPath<TFieldValues>,
      stops as any
    );
  };

  const updateStop = (
    index: number,
    field: 'color' | 'position',
    value: string | number
  ) => {
    const stops = [...gradient.stops];
    stops[index] = { ...stops[index], [field]: value };
    form.setValue(
      `${fieldPath}.background.stops` as FieldPath<TFieldValues>,
      stops as any
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <FormLabel>Color Stops</FormLabel>
        <Button type="button" variant="outline" size="sm" onClick={addStop}>
          <Plus className="h-4 w-4 mr-1" />
          Add Stop
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {gradient.stops.map((stop, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              type="color"
              value={stop.color}
              onChange={(e) => updateStop(index, 'color', e.target.value)}
              className="appearance-none border-1 shadow-sm p-0 bg-transparent cursor-pointer h-10 w-10 rounded-md [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [::-moz-color-swatch]:border-0"
            />
            <Input
              type="text"
              value={stop.color}
              onChange={(e) => updateStop(index, 'color', e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="0"
                max="100"
                value={stop.position}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  updateStop(
                    index,
                    'position',
                    Math.max(0, Math.min(100, val))
                  );
                }}
                className="w-16"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeStop(index)}
              disabled={gradient.stops.length <= 2}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AspectRatioField = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Video Aspect Ratio"
              description="Apply a 16:9 video aspect ratio to your sweepstakes images."
              help={{
                title: 'Help: Video Aspect Ratio',
                content: (
                  <div>
                    Enable this to apply a{' '}
                    <strong>16:9 video aspect ratio</strong> to your sweepstakes
                    images, optimized for modern displays and video content.
                    <br />
                    <br />
                    When disabled, no aspect ratio constraint will be applied
                    and the image will adapt to its natural dimensions.
                  </div>
                )
              }}
            />
            <FormControl>
              <Switch
                checked={field.value === 'VIDEO'}
                onCheckedChange={(checked) => {
                  if (checked) {
                    field.onChange('VIDEO');
                  } else {
                    field.onChange('NONE');
                  }
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};
