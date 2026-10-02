import { act, render } from '@testing-library/react';
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

function getEditable(container: HTMLElement) {
  return container.querySelector('[contenteditable]') as HTMLElement;
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

  it('matches the snapshot of the editable area', async () => {
    const { container } = await renderEditor();
    expect(getEditable(container)).toMatchSnapshot();
  });
});
