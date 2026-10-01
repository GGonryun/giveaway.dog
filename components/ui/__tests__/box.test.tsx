import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Box } from '../box';

type BoxVariantProps = Omit<React.ComponentProps<typeof Box>, 'children'>;

describe('Box', () => {
  it('matches the snapshot with spacing variants', () => {
    const { container } = render(
      <Box sy="md" p="lg" mb="sm">
        Content
      </Box>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders its children inside a div', () => {
    render(<Box>Content</Box>);
    expect(screen.getByText('Content').tagName).toBe('DIV');
  });

  it.each<[BoxVariantProps, string]>([
    [{ sx: 'lg' }, 'space-x-4'],
    [{ sy: 'xs' }, 'space-y-1'],
    [{ mb: 'xl' }, 'mb-5'],
    [{ mt: 'md' }, 'mt-3'],
    [{ my: 'sm' }, 'my-2'],
    [{ px: 'lg' }, 'px-4'],
    [{ p: 'xs' }, 'p-1'],
    [{ w: 8 }, 'w-8']
  ])('maps %o to the %s class', (props, className) => {
    render(<Box {...props}>Content</Box>);
    expect(screen.getByText('Content')).toHaveClass(className);
  });

  it('hides the box with a class instead of the hidden attribute', () => {
    render(<Box hidden>Content</Box>);
    const box = screen.getByText('Content');
    expect(box).toHaveClass('hidden');
    expect(box).not.toHaveAttribute('hidden');
  });

  it('merges a custom class name with the variant classes', () => {
    render(
      <Box p="sm" className="border">
        Content
      </Box>
    );
    expect(screen.getByText('Content')).toHaveClass('p-2', 'border');
  });

  it('forwards other props to the div', () => {
    render(
      <Box id="details" role="region" aria-label="Details">
        Content
      </Box>
    );
    expect(screen.getByRole('region', { name: 'Details' })).toHaveAttribute(
      'id',
      'details'
    );
  });
});
