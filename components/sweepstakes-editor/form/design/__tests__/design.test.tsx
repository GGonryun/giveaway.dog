import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_GRADIENT_DESIGN_BACKGROUND,
  DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND
} from '@/schemas/giveaway/defaults';
import {
  GiveawayDesignBackgroundSchema,
  GiveawayDesignSchema,
  GradientBackgroundSchema
} from '@/schemas/giveaway/schemas';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
import {
  AspectRatioField,
  BackgroundColor,
  BackgroundFields,
  Design,
  DisplayDescriptionField,
  DisplayNameField
} from '../design';

const buildDesign = (
  overrides: Partial<GiveawayDesignSchema> = {}
): GiveawayDesignSchema => ({
  displayName: true,
  displayDescription: true,
  aspectRatio: 'VIDEO',
  background: { type: 'color', color: '#123456' },
  ...overrides
});

const valuesWith = (design: GiveawayDesignSchema) =>
  buildFormValues({ design });

const gradient = (
  overrides: Partial<GradientBackgroundSchema> = {}
): GradientBackgroundSchema => ({
  type: 'gradient',
  format: 'linear',
  angle: 90,
  stops: [
    { color: '#ff0000', position: 0 },
    { color: '#0000ff', position: 50 }
  ],
  ...overrides
});

const renderBackground = (background: GiveawayDesignBackgroundSchema) =>
  renderWithForm(
    (form) => <BackgroundFields form={form} fieldPath="design" />,
    { values: valuesWith(buildDesign({ background })) }
  );

const openGradientEditor = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Modify' }));
  return screen.getByRole('dialog');
};

describe('Design', () => {
  it('matches the snapshot', () => {
    const { container } = renderWithForm(<Design />, {
      values: valuesWith(buildDesign())
    });
    expect(stabilizeIds(container)).toMatchSnapshot();
  });

  it('groups the settings into form design and layout', () => {
    renderWithForm(<Design />, { values: valuesWith(buildDesign()) });
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    ).toEqual(['Form Design', 'Layout']);
  });
});

describe('DisplayNameField', () => {
  it('turns the display of the name on and off', async () => {
    const { form } = renderWithForm(
      (f) => <DisplayNameField form={f} fieldPath="design.displayName" />,
      { values: valuesWith(buildDesign({ displayName: true })) }
    );
    const toggle = screen.getByRole('switch', { name: 'Display Name' });
    expect(toggle).toBeChecked();

    await userEvent.click(toggle);
    expect(form.getValues('design.displayName')).toBe(false);
  });
});

describe('DisplayDescriptionField', () => {
  it('turns the display of the description on and off', async () => {
    const { form } = renderWithForm(
      (f) => (
        <DisplayDescriptionField
          form={f}
          fieldPath="design.displayDescription"
        />
      ),
      { values: valuesWith(buildDesign({ displayDescription: false })) }
    );
    const toggle = screen.getByRole('switch', { name: 'Display Description' });
    expect(toggle).not.toBeChecked();

    await userEvent.click(toggle);
    expect(form.getValues('design.displayDescription')).toBe(true);
  });
});

describe('AspectRatioField', () => {
  const renderAspectRatio = (
    aspectRatio: GiveawayDesignSchema['aspectRatio']
  ) =>
    renderWithForm(
      (f) => <AspectRatioField form={f} fieldPath="design.aspectRatio" />,
      { values: valuesWith(buildDesign({ aspectRatio })) }
    );

  const getSwitch = () =>
    screen.getByRole('switch', { name: 'Video Aspect Ratio' });

  it.each([
    ['VIDEO', true],
    ['NONE', false]
  ] as const)('shows %s as checked=%s', (aspectRatio, checked) => {
    renderAspectRatio(aspectRatio);
    expect(getSwitch()).toHaveAttribute('aria-checked', String(checked));
  });

  it('removes the aspect ratio when turned off', async () => {
    const { form } = renderAspectRatio('VIDEO');
    await userEvent.click(getSwitch());
    expect(form.getValues('design.aspectRatio')).toBe('NONE');
  });

  it('applies the video aspect ratio when turned on', async () => {
    const { form } = renderAspectRatio('NONE');
    await userEvent.click(getSwitch());
    expect(form.getValues('design.aspectRatio')).toBe('VIDEO');
  });
});

describe('BackgroundColor', () => {
  const renderType = (background: GiveawayDesignBackgroundSchema) =>
    renderWithForm(
      (f) => <BackgroundColor form={f} fieldPath="design.background" />,
      { values: valuesWith(buildDesign({ background })) }
    );

  it.each([
    [{ type: 'color', color: '#123456' } as const, 'Solid Color'],
    [gradient(), 'Gradient']
  ])('shows the background type %#', (background, label) => {
    renderType(background);
    expect(screen.getByRole('combobox')).toHaveTextContent(label);
  });

  it('switches to the default gradient', async () => {
    const { form } = renderType({ type: 'color', color: '#123456' });
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Gradient' }));

    expect(form.getValues('design.background')).toEqual(
      DEFAULT_GRADIENT_DESIGN_BACKGROUND
    );
  });

  it('switches to the default solid color', async () => {
    const { form } = renderType(gradient());
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Solid Color' }));

    expect(form.getValues('design.background')).toEqual(
      DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND
    );
  });
});

describe('BackgroundFields', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('with a solid color background', () => {
    it('matches the snapshot', () => {
      const { container } = renderBackground({
        type: 'color',
        color: '#123456'
      });
      expect(stabilizeIds(container)).toMatchSnapshot();
    });

    it('stores the picked color', () => {
      const { container, form } = renderBackground({
        type: 'color',
        color: '#123456'
      });
      const input = container.querySelector('input[type="color"]');
      if (!input) throw new Error('Color input not found');
      expect(input).toHaveValue('#123456');

      fireEvent.change(input, { target: { value: '#abcdef' } });
      expect(form.getValues('design.background')).toEqual({
        type: 'color',
        color: '#abcdef'
      });
    });

    it('opens the native color picker from the modify overlay', async () => {
      const { container } = renderBackground({
        type: 'color',
        color: '#123456'
      });
      const input = container.querySelector('input[type="color"]');
      if (!(input instanceof HTMLInputElement)) {
        throw new Error('Color input not found');
      }
      const onPickerClick = vi.fn();
      input.addEventListener('click', onPickerClick);

      await userEvent.click(screen.getByRole('button', { name: 'Modify' }));
      expect(onPickerClick).toHaveBeenCalled();
    });
  });

  describe('with a gradient background', () => {
    it('matches the snapshot', () => {
      const { container } = renderBackground(gradient());
      expect(stabilizeIds(container)).toMatchSnapshot();
    });

    it('matches the snapshot of the gradient editor', async () => {
      renderBackground(gradient());
      expect(stabilizeIds(await openGradientEditor())).toMatchSnapshot();
    });

    it('shows the gradient settings in the editor', async () => {
      renderBackground(gradient());
      const editor = await openGradientEditor();

      expect(within(editor).getByText('Type')).toBeInTheDocument();
      expect(within(editor).getByText('Angle')).toBeInTheDocument();
      expect(within(editor).getByText('Color Stops')).toBeInTheDocument();
      expect(within(editor).getAllByRole('textbox')).toHaveLength(2);
    });

    it('switches to a radial gradient and hides the angle', async () => {
      const { form } = renderBackground(gradient());
      const editor = await openGradientEditor();
      await userEvent.click(
        within(editor).getByRole('button', { name: 'Radial' })
      );

      expect(form.getValues('design.background')).toMatchObject({
        format: 'radial'
      });
      expect(within(editor).queryByText('Angle')).not.toBeInTheDocument();
    });

    it('switches back to a linear gradient', async () => {
      const { form } = renderBackground(gradient({ format: 'radial' }));
      const editor = await openGradientEditor();
      expect(within(editor).queryByText('Angle')).not.toBeInTheDocument();

      await userEvent.click(
        within(editor).getByRole('button', { name: 'Linear' })
      );
      expect(form.getValues('design.background')).toMatchObject({
        format: 'linear'
      });
      expect(within(editor).getByText('Angle')).toBeInTheDocument();
    });

    it.each([
      ['45', 45],
      ['400', 360],
      ['-10', 0],
      ['', 0]
    ])('stores an angle of %s as %s', async (typed, stored) => {
      const { form } = renderBackground(gradient());
      const editor = await openGradientEditor();
      const [angle] = within(editor).getAllByRole('spinbutton');

      fireEvent.change(angle, { target: { value: typed } });
      expect(form.getValues('design.background')).toMatchObject({
        angle: stored
      });
    });

    it.each([
      [40, 20, 90],
      [20, 40, 180],
      [0, 20, 270],
      [20, 0, 0],
      [0, 0, 315]
    ])(
      'picks the angle from a click on the dial at (%s, %s)',
      async (clientX, clientY, angle) => {
        const { form } = renderBackground(gradient());
        const editor = await openGradientEditor();
        const dial = editor.querySelector('.rounded-full.border-2');
        if (!dial) throw new Error('Angle dial not found');
        vi.spyOn(dial, 'getBoundingClientRect').mockReturnValue({
          left: 0,
          top: 0,
          width: 40,
          height: 40,
          right: 40,
          bottom: 40,
          x: 0,
          y: 0,
          toJSON: () => ({})
        });

        fireEvent.click(dial, { clientX, clientY });
        expect(form.getValues('design.background')).toMatchObject({ angle });
      }
    );

    it('adds a black stop 10% after the last stop', async () => {
      const { form } = renderBackground(gradient());
      const editor = await openGradientEditor();
      await userEvent.click(
        within(editor).getByRole('button', { name: 'Add Stop' })
      );

      expect(form.getValues('design.background')).toMatchObject({
        stops: [
          { color: '#ff0000', position: 0 },
          { color: '#0000ff', position: 50 },
          { color: '#000000', position: 60 }
        ]
      });
    });

    it('caps the position of a new stop at 100%', async () => {
      const { form } = renderBackground(
        gradient({
          stops: [
            { color: '#ff0000', position: 0 },
            { color: '#0000ff', position: 95 }
          ]
        })
      );
      const editor = await openGradientEditor();
      await userEvent.click(
        within(editor).getByRole('button', { name: 'Add Stop' })
      );

      expect(form.getValues('design.background')).toMatchObject({
        stops: [
          { color: '#ff0000', position: 0 },
          { color: '#0000ff', position: 95 },
          { color: '#000000', position: 100 }
        ]
      });
    });

    it('starts at 0% when there are no stops', async () => {
      const { form } = renderBackground(gradient({ stops: [] }));
      const editor = await openGradientEditor();
      await userEvent.click(
        within(editor).getByRole('button', { name: 'Add Stop' })
      );

      expect(form.getValues('design.background')).toMatchObject({
        stops: [{ color: '#000000', position: 0 }]
      });
    });

    it('updates the color of a stop', async () => {
      const { form } = renderBackground(gradient());
      const editor = await openGradientEditor();
      const [, second] = within(editor).getAllByRole('textbox');

      fireEvent.change(second, { target: { value: '#00ff00' } });
      expect(form.getValues('design.background')).toMatchObject({
        stops: [
          { color: '#ff0000', position: 0 },
          { color: '#00ff00', position: 50 }
        ]
      });
    });

    it.each([
      ['30', 30],
      ['150', 100],
      ['-5', 0],
      ['abc', 0]
    ])('stores a stop position of %s as %s', async (typed, stored) => {
      const { form } = renderBackground(gradient());
      const editor = await openGradientEditor();
      const [, , secondPosition] = within(editor).getAllByRole('spinbutton');

      fireEvent.change(secondPosition, { target: { value: typed } });
      expect(form.getValues('design.background')).toMatchObject({
        stops: [
          { color: '#ff0000', position: 0 },
          { color: '#0000ff', position: stored }
        ]
      });
    });

    it('keeps at least two stops', async () => {
      renderBackground(gradient());
      const editor = await openGradientEditor();
      const removeButtons = editor.querySelectorAll(
        'button:has(.lucide-trash-2)'
      );

      expect(removeButtons).toHaveLength(2);
      removeButtons.forEach((button) => expect(button).toBeDisabled());
    });

    it('removes a stop when there are more than two', async () => {
      const { form } = renderBackground(
        gradient({
          stops: [
            { color: '#ff0000', position: 0 },
            { color: '#00ff00', position: 50 },
            { color: '#0000ff', position: 100 }
          ]
        })
      );
      const editor = await openGradientEditor();
      const removeButtons = editor.querySelectorAll(
        'button:has(.lucide-trash-2)'
      );
      await userEvent.click(removeButtons[1]);

      expect(form.getValues('design.background')).toMatchObject({
        stops: [
          { color: '#ff0000', position: 0 },
          { color: '#0000ff', position: 100 }
        ]
      });
    });
  });

  it('throws for an unknown background type', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const background = {
      type: 'pattern'
    } as unknown as GiveawayDesignBackgroundSchema;

    expect(() => renderBackground(background)).toThrow(
      'Unexpected value: pattern'
    );
  });
});
