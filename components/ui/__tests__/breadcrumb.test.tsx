import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '../breadcrumb';

function renderBreadcrumb() {
  return render(
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="https://example.com">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Giveaways</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

describe('Breadcrumb', () => {
  it('renders a navigation landmark named breadcrumb', () => {
    renderBreadcrumb();
    expect(
      screen.getByRole('navigation', { name: 'breadcrumb' })
    ).toBeInTheDocument();
  });

  it('renders the trail as an ordered list without the separators', () => {
    renderBreadcrumb();
    expect(screen.getByRole('list').tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('links to previous pages', () => {
    renderBreadcrumb();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      'https://example.com'
    );
  });

  it('marks the current page as a disabled link', () => {
    renderBreadcrumb();
    const page = screen.getByRole('link', { name: 'Giveaways' });
    expect(page.tagName).toBe('SPAN');
    expect(page).toHaveAttribute('aria-current', 'page');
    expect(page).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders a chevron separator by default and custom content otherwise', () => {
    const { container } = renderBreadcrumb();
    const [chevron, custom] = Array.from(
      container.querySelectorAll('li[role="presentation"]')
    );
    expect(chevron.querySelector('svg')).toBeInTheDocument();
    expect(custom).toHaveTextContent('/');
    expect(custom.querySelector('svg')).not.toBeInTheDocument();
  });

  it('hides separators and the ellipsis from assistive technology', () => {
    const { container } = renderBreadcrumb();
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(
      Array.from(hidden).filter(
        (element) => element.getAttribute('role') === 'presentation'
      )
    ).toHaveLength(3);
    expect(screen.getByText('More')).toHaveClass('sr-only');
  });

  it('renders its child element when BreadcrumbLink uses asChild', () => {
    render(
      <BreadcrumbLink asChild className="font-bold">
        <button type="button">Back</button>
      </BreadcrumbLink>
    );
    expect(screen.getByRole('button', { name: 'Back' })).toHaveClass(
      'transition-colors',
      'font-bold'
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
