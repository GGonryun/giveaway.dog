import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '../pagination';

function renderPagination() {
  return render(
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="https://example.com/?page=1" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="https://example.com/?page=1">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="https://example.com/?page=2" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="https://example.com/?page=3" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

describe('Pagination', () => {
  it('renders a navigation landmark with a list of pages', () => {
    renderPagination();
    const nav = screen.getByRole('navigation', { name: 'pagination' });
    expect(nav).toHaveAttribute('data-slot', 'pagination');
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('marks the active page as the current page', () => {
    renderPagination();
    const active = screen.getByRole('link', { name: '2' });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active).toHaveAttribute('data-active', 'true');
    expect(active).toHaveClass('border', 'bg-white', 'size-9');
  });

  it('renders inactive pages as ghost links without aria-current', () => {
    renderPagination();
    const inactive = screen.getByRole('link', { name: '1' });
    expect(inactive).not.toHaveAttribute('aria-current');
    expect(inactive).not.toHaveAttribute('data-active');
    expect(inactive).not.toHaveClass('border');
    expect(inactive).toHaveClass('size-9');
  });

  it('labels the previous and next links', () => {
    renderPagination();
    expect(
      screen.getByRole('link', { name: 'Go to previous page' })
    ).toHaveAttribute('href', 'https://example.com/?page=1');
    expect(
      screen.getByRole('link', { name: 'Go to next page' })
    ).toHaveAttribute('href', 'https://example.com/?page=3');
  });

  it('uses the default button size for the previous and next links', () => {
    renderPagination();
    const previous = screen.getByRole('link', { name: 'Go to previous page' });
    expect(previous).toHaveClass('h-9', 'gap-1', 'px-2.5');
    expect(previous).not.toHaveClass('size-9');
    expect(previous).toHaveTextContent('Previous');
  });

  it('hides the ellipsis from assistive technology', () => {
    const { container } = renderPagination();
    const ellipsis = container.querySelector(
      '[data-slot="pagination-ellipsis"]'
    );
    expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
    expect(ellipsis).toHaveTextContent('More pages');
  });

  it('lets a page link use another size', () => {
    render(
      <PaginationLink href="https://example.com/?page=4" size="sm">
        4
      </PaginationLink>
    );
    expect(screen.getByRole('link', { name: '4' })).toHaveClass('h-8');
  });
});
