import { describe, expect, test } from 'vitest';
import { renderVisual, THEMES } from '@/test/visual/render';
import { Checkbox } from '../checkbox';
import { Input } from '../input';
import { Label } from '../label';
import { RadioGroup, RadioGroupItem } from '../radio-group';
import { Switch } from '../switch';
import { Textarea } from '../textarea';

describe.each(THEMES)('Form controls (%s)', (theme) => {
  test('text fields', async () => {
    const root = await renderVisual(
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" defaultValue="Summer giveaway" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="empty">Empty</Label>
          <Input id="empty" placeholder="Enter a title" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="invalid">Invalid</Label>
          <Input id="invalid" aria-invalid defaultValue="???" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="disabled">Disabled</Label>
          <Input id="disabled" disabled defaultValue="Read only" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" defaultValue="Win a new gaming headset." />
        </div>
      </div>,
      { theme }
    );
    await expect.element(root).toMatchScreenshot();
  });

  test('choices', async () => {
    const root = await renderVisual(
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Checkbox aria-label="Unchecked" />
          <Checkbox aria-label="Checked" defaultChecked />
          <Checkbox aria-label="Disabled" disabled />
          <Checkbox aria-label="Disabled and checked" disabled defaultChecked />
        </div>
        <div className="flex items-center gap-4">
          <Switch aria-label="Off" />
          <Switch aria-label="On" defaultChecked />
          <Switch aria-label="Disabled" disabled />
        </div>
        <RadioGroup defaultValue="host" className="flex gap-4">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="host" id="host" />
            <Label htmlFor="host">Host</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="participate" id="participate" />
            <Label htmlFor="participate">Participate</Label>
          </div>
        </RadioGroup>
      </div>,
      { theme }
    );
    await expect.element(root).toMatchScreenshot();
  });
});
