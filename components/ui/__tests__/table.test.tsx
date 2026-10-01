import { render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '../table';

function renderTable() {
  return render(
    <Table>
      <TableCaption>Recent entries</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Entries</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow data-state="selected">
          <TableCell>Ada</TableCell>
          <TableCell>3</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Grace</TableCell>
          <TableCell>5</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>8</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

describe('Table', () => {
  it('matches the snapshot', () => {
    const { container } = renderTable();
    expect(container.firstChild).toMatchSnapshot();
  });

  it('exposes an accessible table named by its caption', () => {
    renderTable();
    expect(
      screen.getByRole('table', { name: 'Recent entries' })
    ).toBeInTheDocument();
  });

  it('renders column headers, body cells and footer cells', () => {
    renderTable();
    expect(
      screen.getAllByRole('columnheader').map((cell) => cell.textContent)
    ).toEqual(['Name', 'Entries']);
    expect(screen.getAllByRole('cell')).toHaveLength(6);
  });

  it('groups rows into header, body and footer sections', () => {
    renderTable();
    const [header, body, footer] = screen.getAllByRole('rowgroup');
    expect(header.tagName).toBe('THEAD');
    expect(within(body).getAllByRole('row')).toHaveLength(2);
    expect(footer.tagName).toBe('TFOOT');
    expect(footer).toHaveTextContent('Total8');
  });

  it('wraps the table in a scrollable container', () => {
    renderTable();
    expect(screen.getByRole('table').parentElement).toHaveClass(
      'relative',
      'w-full',
      'overflow-auto'
    );
  });

  it('forwards the ref to the table element', () => {
    const ref = createRef<HTMLTableElement>();
    render(
      <Table ref={ref}>
        <TableBody />
      </Table>
    );
    expect(ref.current).toBe(screen.getByRole('table'));
  });

  it('merges custom class names on each part', () => {
    render(
      <Table className="table-fixed">
        <TableBody className="divide-y">
          <TableRow className="h-12">
            <TableHead className="w-1/2">Head</TableHead>
            <TableCell className="text-right">Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByRole('table')).toHaveClass('table-fixed', 'w-full');
    expect(screen.getByRole('rowgroup')).toHaveClass('divide-y');
    expect(screen.getByRole('row')).toHaveClass('h-12', 'border-b');
    expect(screen.getByText('Head')).toHaveClass('w-1/2', 'font-medium');
    expect(screen.getByText('Cell')).toHaveClass('text-right', 'px-4');
  });
});
