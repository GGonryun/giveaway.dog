import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';

import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND,
  DEFAULT_GRADIENT_DESIGN_BACKGROUND
} from '@/schemas/giveaway/defaults';
import { Input } from '@/components/ui/input';
import { assertNever } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { toGradient } from '@/schemas/color';
import { UnifiedSectionHeader } from '@/components/patterns/form-layout/section-header';

export const Design = () => {
  return (
    <>
      <UnifiedSectionHeader
        label="Form Design"
        description="Customize the content and appearance of your sweepstakes form"
      >
        <DisplayNameField />
        <DisplayDescriptionField />
      </UnifiedSectionHeader>
      <UnifiedSectionHeader
        label="Layout"
        description="Choose the layout and background style for your giveaway"
        className="border-t"
      >
        <BackgroundColor />
        <BackgroundFields />
      </UnifiedSectionHeader>
    </>
  );
};

const DisplayNameField = () => {
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name="design.displayName"
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

const DisplayDescriptionField = () => {
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name="design.displayDescription"
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

const BackgroundColor = () => {
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name="design.background"
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

const BackgroundFields = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const backgroundType = form.watch('design.background.type');
  switch (backgroundType) {
    case 'color':
      return <ColorPicker />;
    case 'gradient':
      return <GradientPicker />;
    default:
      throw assertNever(backgroundType);
  }
};

const ColorPicker = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const color = form.watch('design.background.color');
  const colorInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <FormField
      control={form.control}
      name="design.background.color"
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

const GradientPicker = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const gradient = form.watch('design.background');
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
            <GradientDirectionField />
            <GradientAngleField />
            <GradientStopsField />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const GradientDirectionField = () => {
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name="design.background.format"
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

const GradientAngleField = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const direction = form.watch('design.background.format');

  if (direction !== 'linear') return null;

  return (
    <FormField
      control={form.control}
      name="design.background.angle"
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

const GradientStopsField = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const gradient = form.watch('design.background');

  if (gradient.type !== 'gradient') return null;

  const addStop = () => {
    const stops = gradient.stops;
    const newPosition =
      stops.length > 0
        ? Math.min(stops[stops.length - 1].position + 10, 100)
        : 0;
    form.setValue('design.background.stops', [
      ...stops,
      { color: '#000000', position: newPosition }
    ]);
  };

  const removeStop = (index: number) => {
    const stops = gradient.stops.filter((_, i) => i !== index);
    form.setValue('design.background.stops', stops);
  };

  const updateStop = (
    index: number,
    field: 'color' | 'position',
    value: string | number
  ) => {
    const stops = [...gradient.stops];
    stops[index] = { ...stops[index], [field]: value };
    form.setValue('design.background.stops', stops);
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
