import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from '../command';
import { withStableIds } from './test-utils';

function renderCommand(onSelect = vi.fn()) {
  const result = render(
    <Command>
      <CommandInput placeholder="Search giveaways..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Giveaways">
          <CommandItem onSelect={onSelect}>Summer bike</CommandItem>
          <CommandItem>
            Winter jacket
            <CommandShortcut>⌘J</CommandShortcut>
          </CommandItem>
          <CommandItem disabled onSelect={onSelect}>
            Archived prize
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>Billing</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
  return { ...result, onSelect };
}

describe('Command', () => {
  it('matches the snapshot', () => {
    const { container } = renderCommand();
    expect(withStableIds(container.firstChild)).toMatchSnapshot();
  });
});
