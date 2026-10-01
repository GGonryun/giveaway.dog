import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AllGiveawaysSearch } from '../all-giveaways-search';

const searchBox = () => screen.getByRole('searchbox');

describe('AllGiveawaysSearch', () => {
  it('renders an empty search box with a hint', () => {
    render(<AllGiveawaysSearch />);
    expect(searchBox()).toHaveValue('');
    expect(searchBox()).toHaveAttribute(
      'placeholder',
      'Search giveaways by name or description...'
    );
  });

  it('pre-fills the default value', () => {
    render(<AllGiveawaysSearch defaultValue="headset" />);
    expect(searchBox()).toHaveValue('headset');
  });

  it('searches for the typed query when submitted with the button', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<AllGiveawaysSearch onSearch={onSearch} />);

    await user.type(searchBox(), 'headset');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith('headset');
  });

  it('searches when enter is pressed', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<AllGiveawaysSearch onSearch={onSearch} />);

    await user.type(searchBox(), 'gift card{Enter}');

    expect(onSearch).toHaveBeenCalledWith('gift card');
  });

  it('does nothing on submit without a search handler', async () => {
    const user = userEvent.setup();
    render(<AllGiveawaysSearch />);
    await user.type(searchBox(), 'headset{Enter}');
    expect(searchBox()).toHaveValue('headset');
  });

  it('only offers clearing once there is a query', async () => {
    const user = userEvent.setup();
    render(<AllGiveawaysSearch />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await user.type(searchBox(), 'h');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('clears the query and notifies the parent', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const onSearch = vi.fn();
    render(
      <AllGiveawaysSearch
        defaultValue="headset"
        onClear={onClear}
        onSearch={onSearch}
      />
    );

    await user.click(screen.getAllByRole('button')[0]);

    expect(searchBox()).toHaveValue('');
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
