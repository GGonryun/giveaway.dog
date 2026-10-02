import { describe, expect, test } from 'vitest';
import { renderVisual, THEMES } from '@/test/visual/render';
import { Badge } from '../badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../table';

const ROWS = [
  { name: 'Ada Lovelace', entries: 12, status: 'Winner' },
  { name: 'Alan Turing', entries: 8, status: 'Entered' },
  { name: 'Grace Hopper', entries: 3, status: 'Entered' }
];

describe.each(THEMES)('Table (%s)', (theme) => {
  test('with rows', async () => {
    const root = await renderVisual(
      <Table>
        <TableCaption>The last three participants</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Entries</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row) => (
            <TableRow key={row.name}>
              <TableCell>{row.name}</TableCell>
              <TableCell className="text-right">{row.entries}</TableCell>
              <TableCell>
                <Badge
                  variant={row.status === 'Winner' ? 'success' : 'secondary'}
                >
                  {row.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>,
      { theme }
    );
    await expect.element(root).toMatchScreenshot();
  });
});
