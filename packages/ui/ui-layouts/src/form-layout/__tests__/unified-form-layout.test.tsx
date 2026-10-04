import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UnifiedFormLayout } from '../unified-form-layout';
import {
  LayoutContextValue,
  renderWithLayout
} from '../../testing/layout-context';

const renderLayout = (overrides: Partial<LayoutContextValue> = {}) =>
  renderWithLayout(
    <UnifiedFormLayout
      form={<div>Form body</div>}
      preview={<div>Preview body</div>}
      previewFooter={<div>Preview footer</div>}
    />,
    overrides
  );

describe('UnifiedFormLayout', () => {
  it('shows only a spinner while the layout is loading', () => {
    const { container } = renderLayout({ isLoadingLayout: true });
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByText('Form body')).not.toBeInTheDocument();
  });

  it('shows the form and preview side by side on desktop', () => {
    renderLayout({ mobile: false });
    expect(screen.getByText('Form body')).toBeInTheDocument();
    expect(screen.getByText('Preview body')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Preview' })
    ).not.toBeInTheDocument();
  });

  it('shows the form with an edit and preview toggle on mobile', () => {
    renderLayout({ mobile: true });
    expect(screen.getByText('Form body')).toBeInTheDocument();
    expect(screen.queryByText('Preview body')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
  });
});
