import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Typography } from '../typography';

describe('Typography', () => {
  it('renders a div with the default size and weight', () => {
    render(<Typography>Body text</Typography>);
    const text = screen.getByText('Body text');
    expect(text.tagName).toBe('DIV');
    expect(text).toHaveClass('text-sm', 'font-normal');
  });

  it('applies the size, weight, color, leading and words variants', () => {
    render(
      <Typography
        size="lg"
        weight="bold"
        color="muted"
        leading="relaxed"
        words="break"
      >
        Body text
      </Typography>
    );
    expect(screen.getByText('Body text')).toHaveClass(
      'text-lg',
      'font-bold',
      'text-muted-foreground',
      'leading-relaxed',
      'break-words'
    );
  });

  it('does not forward its variant props to the DOM', () => {
    render(
      <Typography size="lg" weight="bold" color="primary">
        Body text
      </Typography>
    );
    const text = screen.getByText('Body text');
    expect(text).not.toHaveAttribute('size');
    expect(text).not.toHaveAttribute('weight');
    expect(text).not.toHaveAttribute('color');
  });

  it('merges a custom class name and forwards other props', () => {
    render(
      <Typography className="truncate" id="intro">
        Body text
      </Typography>
    );
    const text = screen.getByText('Body text');
    expect(text).toHaveClass('truncate', 'text-sm');
    expect(text).toHaveAttribute('id', 'intro');
  });
});

describe('Typography.Paragraph', () => {
  it('renders a paragraph with the typography variants', () => {
    render(
      <Typography.Paragraph weight="medium">Paragraph</Typography.Paragraph>
    );
    const paragraph = screen.getByText('Paragraph');
    expect(paragraph.tagName).toBe('P');
    expect(paragraph).toHaveClass('text-sm', 'font-medium');
  });
});

describe('Typography.Text', () => {
  it('renders an inline span', () => {
    render(<Typography.Text className="italic">Inline</Typography.Text>);
    const text = screen.getByText('Inline');
    expect(text.tagName).toBe('SPAN');
    expect(text).toHaveClass('text-sm', 'font-normal', 'italic');
  });

  it('forwards its variant props to the DOM as attributes', () => {
    render(
      <Typography.Text weight="bold" color="muted" leading="none">
        Inline
      </Typography.Text>
    );
    const text = screen.getByText('Inline');
    expect(text).toHaveClass(
      'font-bold',
      'text-muted-foreground',
      'leading-none'
    );
    expect(text).toHaveAttribute('weight', 'bold');
    expect(text).toHaveAttribute('color', 'muted');
    expect(text).toHaveAttribute('leading', 'none');
  });
});

describe('Typography.Code', () => {
  it('renders a code element with a boxed style', () => {
    render(<Typography.Code>pnpm install</Typography.Code>);
    const code = screen.getByText('pnpm install');
    expect(code.tagName).toBe('CODE');
    expect(code).toHaveClass('bg-gray-100', 'border', 'rounded-sm', 'text-sm');
  });
});

describe('Typography.Caption', () => {
  it('renders small muted text', () => {
    render(<Typography.Caption>Caption</Typography.Caption>);
    const caption = screen.getByText('Caption');
    expect(caption.tagName).toBe('SPAN');
    expect(caption).toHaveClass('text-xs', 'text-muted-foreground');
  });

  it('lets the size variant replace the default caption size', () => {
    render(<Typography.Caption size="lg">Caption</Typography.Caption>);
    const caption = screen.getByText('Caption');
    expect(caption).toHaveClass('text-lg', 'text-muted-foreground');
    expect(caption).not.toHaveClass('text-xs');
  });
});

describe('Typography.Header', () => {
  it.each([
    [1, 'text-3xl', 'font-bold'],
    [2, 'text-2xl', 'font-semibold'],
    [3, 'text-xl', 'font-semibold'],
    [4, 'text-lg', 'font-semibold'],
    [5, 'text-base', 'font-semibold'],
    [6, 'text-sm', 'font-semibold']
  ] as const)(
    'renders level %i as a heading with %s and %s',
    (level, size, weight) => {
      render(<Typography.Header level={level}>Title</Typography.Header>);
      const heading = screen.getByRole('heading', { level, name: 'Title' });
      expect(heading.tagName).toBe(`H${level}`);
      expect(heading).toHaveClass(size, weight);
    }
  );

  it('lets variant props override the level defaults', () => {
    render(
      <Typography.Header level={1} size="sm" weight="light" color="primary">
        Title
      </Typography.Header>
    );
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('text-sm', 'font-light', 'text-primary');
    expect(heading).not.toHaveClass('text-3xl');
    expect(heading).not.toHaveAttribute('size');
  });

  it('merges a custom class name', () => {
    render(
      <Typography.Header level={3} className="mb-2">
        Title
      </Typography.Header>
    );
    expect(screen.getByRole('heading', { level: 3 })).toHaveClass(
      'mb-2',
      'text-xl'
    );
  });
});
