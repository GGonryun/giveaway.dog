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

const TOOLS = [
  'bold',
  'italic',
  'strike',
  'code',
  'heading1',
  'heading2',
  'heading3',
  'bulletList',
  'orderedList',
  'link',
  'alignLeft',
  'alignCenter',
  'alignRight'
] as const;

type Tool = (typeof TOOLS)[number];

function getTool(tool: Tool) {
  return screen.getAllByRole('button')[TOOLS.indexOf(tool)];
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

  it('renders icon-only toolbar buttons without accessible names', async () => {
    await renderEditor();
    screen.getAllByRole('button').forEach((button) => {
      expect(button).toHaveAccessibleName('');
    });
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

  it('still lets the toolbar change the content when not editable', async () => {
    const onChange = vi.fn();
    await renderEditor(
      <MinimalTiptap
        content="<p>Hello world</p>"
        editable={false}
        onChange={onChange}
      />
    );
    expect(getTool('heading2')).toBeEnabled();

    await userEvent.click(getTool('heading2'));

    expect(onChange).toHaveBeenLastCalledWith('<h2>Hello world</h2><p></p>');
  });

  it('registers the link extension twice', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await renderEditor();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Duplicate extension names found: ['link']")
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
