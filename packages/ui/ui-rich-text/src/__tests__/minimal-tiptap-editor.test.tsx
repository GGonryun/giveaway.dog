import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi
} from 'vitest';
import { MinimalTiptap } from '../minimal-tiptap-editor';

const TOOL_NAMES = {
  bold: 'Bold',
  italic: 'Italic',
  strike: 'Strikethrough',
  code: 'Code',
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  bulletList: 'Bullet list',
  orderedList: 'Numbered list',
  link: 'Link',
  alignLeft: 'Align left',
  alignCenter: 'Align center',
  alignRight: 'Align right'
} as const;

const TOOLS = Object.keys(TOOL_NAMES) as (keyof typeof TOOL_NAMES)[];

type Tool = keyof typeof TOOL_NAMES;

function getTool(tool: Tool) {
  return screen.getByRole('button', { name: TOOL_NAMES[tool] });
}

function getEditable(container: HTMLElement) {
  return container.querySelector('[contenteditable]') as HTMLElement;
}

function StatefulEditor({
  initialContent,
  onChange
}: {
  initialContent: string;
  onChange: (content: string) => void;
}) {
  const [content, setContent] = useState(initialContent);
  return (
    <MinimalTiptap
      content={content}
      onChange={(next) => {
        setContent(next);
        onChange(next);
      }}
    />
  );
}

async function renderEditor(
  ui: React.ReactElement = <MinimalTiptap content="<p>Hello world</p>" />
) {
  const result = render(ui);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return result;
}

async function renderWithSelection(initialContent = '<p>Hello world</p>') {
  const onChange = vi.fn();
  const { container } = await renderEditor(
    <StatefulEditor initialContent={initialContent} onChange={onChange} />
  );
  await userEvent.click(getEditable(container));
  await userEvent.keyboard('{Control>}a{/Control}');
  return { container, onChange };
}

describe('MinimalTiptap', () => {
  beforeAll(() => {
    const emptyRect = new DOMRect(0, 0, 0, 0);
    Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
      configurable: true,
      value: () => emptyRect
    });
    Object.defineProperty(Range.prototype, 'getClientRects', {
      configurable: true,
      value: () => []
    });
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: () => null
    });
  });

  afterAll(() => {
    Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect');
    Reflect.deleteProperty(Range.prototype, 'getClientRects');
    Reflect.deleteProperty(document, 'elementFromPoint');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the toolbar and the initial content once the editor is ready', async () => {
    const { container } = await renderEditor(
      <MinimalTiptap content="<p>Hello <strong>world</strong></p>" />
    );
    expect(screen.getAllByRole('button')).toHaveLength(TOOLS.length);
    const editable = getEditable(container);
    expect(editable).toHaveAttribute('contenteditable', 'true');
    expect(editable).toHaveClass('ProseMirror', 'min-h-[200px]');
    expect(editable).toHaveTextContent('Hello world');
    expect(screen.getByText('world').tagName).toBe('STRONG');
  });

  it('names the editable area and passes the form control attributes to it', async () => {
    await renderEditor(
      <MinimalTiptap
        id="description-form-item"
        aria-label="Description"
        aria-describedby="description-form-item-description"
        aria-invalid={false}
      />
    );
    const editable = screen.getByRole('textbox', { name: 'Description' });
    expect(editable).toHaveAttribute('contenteditable', 'true');
    expect(editable).toHaveAttribute('id', 'description-form-item');
    expect(editable).toHaveAttribute('aria-multiline', 'true');
    expect(editable).toHaveAttribute(
      'aria-describedby',
      'description-form-item-description'
    );
    expect(editable).toHaveAttribute('aria-invalid', 'false');
  });

  it('updates the attributes of the editable area when they change', async () => {
    const { rerender } = await renderEditor(
      <MinimalTiptap aria-label="Description" aria-invalid={false} />
    );
    rerender(
      <MinimalTiptap
        aria-labelledby="description-label"
        aria-describedby="description-message"
        aria-invalid
      />
    );
    const editable = screen.getByRole('textbox');
    expect(editable).not.toHaveAttribute('aria-label');
    expect(editable).toHaveAttribute('aria-labelledby', 'description-label');
    expect(editable).toHaveAttribute('aria-describedby', 'description-message');
    expect(editable).toHaveAttribute('aria-invalid', 'true');
  });

  it("shows the caller's placeholder on an empty editor", async () => {
    const { container } = await renderEditor(
      <MinimalTiptap placeholder="Enter a description" />
    );
    const paragraph = getEditable(container).querySelector('p');
    expect(paragraph).toHaveClass('is-editor-empty');
    expect(paragraph).toHaveAttribute(
      'data-placeholder',
      'Enter a description'
    );
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-placeholder',
      'Enter a description'
    );
  });

  it('shows the default placeholder when the caller passes none', async () => {
    const { container } = await renderEditor(<MinimalTiptap />);
    expect(getEditable(container).querySelector('p')).toHaveAttribute(
      'data-placeholder',
      'Start typing...'
    );
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-placeholder',
      'Start typing...'
    );
  });

  it('does not put the placeholder on the wrapper of the editable area', async () => {
    const { container } = await renderEditor(
      <MinimalTiptap placeholder="Enter a description" />
    );
    expect(container.querySelector('div[placeholder]')).toBeNull();
  });

  it('hides the placeholder once the editor has content', async () => {
    const { container } = await renderEditor(
      <MinimalTiptap content="<p>Hello</p>" placeholder="Enter a description" />
    );
    const paragraph = getEditable(container).querySelector('p');
    expect(paragraph).not.toHaveClass('is-editor-empty');
    expect(paragraph).not.toHaveAttribute('data-placeholder');
  });

  it('shows the placeholder again when the content is cleared', async () => {
    const { container } = await renderWithSelection();
    await userEvent.keyboard('{Backspace}');
    const paragraph = getEditable(container).querySelector('p');
    expect(paragraph).toHaveClass('is-editor-empty');
    expect(paragraph).toHaveAttribute('data-placeholder', 'Start typing...');
  });

  it('updates the placeholder when it changes', async () => {
    const { container, rerender } = await renderEditor(
      <MinimalTiptap placeholder="Enter a description" />
    );
    rerender(<MinimalTiptap placeholder="Enter the terms" />);
    expect(getEditable(container).querySelector('p')).toHaveAttribute(
      'data-placeholder',
      'Enter the terms'
    );
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-placeholder',
      'Enter the terms'
    );
  });

  it('names each icon-only toolbar button', async () => {
    await renderEditor();
    expect(
      screen
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label'))
    ).toEqual(Object.values(TOOL_NAMES));
  });

  it('reports typed content as HTML', async () => {
    const onChange = vi.fn();
    const { container } = await renderEditor(
      <MinimalTiptap content="<p>Hello world</p>" onChange={onChange} />
    );
    await userEvent.click(getEditable(container));
    await userEvent.keyboard('Hi ');
    expect(onChange).toHaveBeenLastCalledWith('<p>Hi Hello world</p>');
  });

  it.each<[Tool, string]>([
    ['bold', '<p><strong>Hello world</strong></p>'],
    ['italic', '<p><em>Hello world</em></p>'],
    ['strike', '<p><s>Hello world</s></p>'],
    ['code', '<p><code>Hello world</code></p>']
  ])('applies the %s mark to the selection', async (tool, html) => {
    const { onChange } = await renderWithSelection();
    await userEvent.click(getTool(tool));
    expect(onChange).toHaveBeenLastCalledWith(html);
    expect(getTool(tool)).toHaveAttribute('aria-pressed', 'true');
  });

  it.each<[Tool, string]>([
    ['heading1', '<h1>Hello world</h1><p></p>'],
    ['heading2', '<h2>Hello world</h2><p></p>'],
    ['heading3', '<h3>Hello world</h3><p></p>'],
    ['bulletList', '<ul><li><p>Hello world</p></li></ul><p></p>'],
    ['orderedList', '<ol><li><p>Hello world</p></li></ol><p></p>']
  ])('turns the selection into a %s', async (tool, html) => {
    const { onChange } = await renderWithSelection();
    await userEvent.click(getTool(tool));
    expect(onChange).toHaveBeenLastCalledWith(html);
  });

  it.each<[Tool, string]>([
    ['alignLeft', 'left'],
    ['alignCenter', 'center'],
    ['alignRight', 'right']
  ])('aligns the selection with %s', async (tool, alignment) => {
    const { onChange } = await renderWithSelection();
    await userEvent.click(getTool(tool));
    expect(onChange).toHaveBeenLastCalledWith(
      `<p style="text-align: ${alignment};">Hello world</p>`
    );
    expect(getTool(tool)).toHaveAttribute('aria-pressed', 'true');
  });

  it('links the selection to the URL entered in the prompt', async () => {
    const prompt = vi
      .spyOn(window, 'prompt')
      .mockReturnValue('https://example.com');
    const { onChange } = await renderWithSelection();

    await userEvent.click(getTool('link'));

    expect(prompt).toHaveBeenCalledWith('URL', undefined);
    expect(onChange).toHaveBeenLastCalledWith(
      '<p><a target="_blank" rel="noopener noreferrer nofollow" class="text-primary underline hover:text-primary/80" href="https://example.com">Hello world</a></p>'
    );
    expect(getTool('link')).toHaveClass('bg-muted');
  });

  it('leaves the content alone when the link prompt is cancelled', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    const { onChange } = await renderWithSelection();
    await userEvent.click(getTool('link'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes the link when the prompt is cleared', async () => {
    const prompt = vi.spyOn(window, 'prompt').mockReturnValue('');
    const { onChange } = await renderWithSelection(
      '<p><a href="https://example.com">Hello</a> world</p>'
    );

    await userEvent.click(getTool('link'));

    expect(prompt).toHaveBeenCalledWith('URL', 'https://example.com');
    expect(onChange).toHaveBeenLastCalledWith('<p>Hello world</p>');
  });

  it('cannot be typed into when not editable', async () => {
    const { container } = await renderEditor(
      <MinimalTiptap content="<p>Hello world</p>" editable={false} />
    );
    expect(getEditable(container)).toHaveAttribute('contenteditable', 'false');
  });

  it('shows no toolbar and calls no onChange when not editable', async () => {
    const onChange = vi.fn();
    await renderEditor(
      <MinimalTiptap
        content="<p>Hello world</p>"
        editable={false}
        onChange={onChange}
      />
    );
    for (const tool of TOOLS) {
      expect(
        screen.queryByRole('button', { name: TOOL_NAMES[tool] })
      ).not.toBeInTheDocument();
    }
    expect(onChange).not.toHaveBeenCalled();
  });

  it('hides the toolbar and stops editing when editable turns false', async () => {
    const { container, rerender } = await renderEditor(
      <MinimalTiptap content="<p>Hello world</p>" />
    );
    expect(getTool('heading2')).toBeEnabled();

    rerender(<MinimalTiptap content="<p>Hello world</p>" editable={false} />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(
      screen.queryByRole('button', { name: TOOL_NAMES.heading2 })
    ).not.toBeInTheDocument();
    expect(getEditable(container)).toHaveAttribute('contenteditable', 'false');
  });

  it('registers the link extension once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await renderEditor();
    expect(warn).not.toHaveBeenCalledWith(
      expect.stringContaining('Duplicate extension names found')
    );
  });

  it('merges a custom class name on the wrapper', async () => {
    const { container } = await renderEditor(
      <MinimalTiptap content="<p>Hello</p>" className="min-h-40" />
    );
    expect(container.firstChild).toHaveClass(
      'border',
      'rounded-lg',
      'min-h-40'
    );
  });
});
