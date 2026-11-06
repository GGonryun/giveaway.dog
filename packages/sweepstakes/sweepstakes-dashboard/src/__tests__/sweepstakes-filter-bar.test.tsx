import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ListSweepstakesFilters } from '@giveaway/sweepstakes-model/sweepstakes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SweepstakesFilterBar } from '../sweepstakes-filter-bar';

type Updater = (params: URLSearchParams) => void;

const page = vi.hoisted(() => ({
  updateParams: (() => '') as (updater: Updater) => string
}));

vi.mock('@giveaway/sweepstakes-routes/use-sweepstakes-page', () => ({
  useSweepstakesPage: () => ({ updateParams: page.updateParams })
}));

const navigator = (query: string) =>
  vi.fn((updater: Updater) => {
    const params = new URLSearchParams(query);
    updater(params);
    return params.toString();
  });

const searchBox = () => screen.getByRole('textbox');

const renderBar = (filters: ListSweepstakesFilters = {}) =>
  render(<SweepstakesFilterBar filters={filters} />);

describe('SweepstakesFilterBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    page.updateParams = navigator('');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('names the date range select', () => {
    renderBar({ dateRange: 'all' });

    expect(
      screen.getByRole('combobox', { name: 'Date range' })
    ).toBeInTheDocument();
  });

  it('does not navigate on mount', () => {
    const updateParams = navigator('status=RUNNING');
    page.updateParams = updateParams;
    renderBar({ search: 'spring' });

    act(() => vi.advanceTimersByTime(1000));

    expect(updateParams).not.toHaveBeenCalled();
    expect(searchBox()).toHaveValue('spring');
  });

  it('navigates 300 ms after the last keystroke with the typed search', () => {
    const updateParams = navigator('status=RUNNING');
    page.updateParams = updateParams;
    renderBar();

    fireEvent.change(searchBox(), { target: { value: 'spr' } });
    act(() => vi.advanceTimersByTime(299));
    fireEvent.change(searchBox(), { target: { value: 'spring' } });
    act(() => vi.advanceTimersByTime(299));

    expect(updateParams).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));

    expect(updateParams).toHaveReturnedTimes(1);
    expect(updateParams).toHaveReturnedWith('status=RUNNING&search=spring');
  });

  it('keeps the params that change before the timer fires', () => {
    const stale = navigator('');
    page.updateParams = stale;
    const { rerender } = renderBar();

    fireEvent.change(searchBox(), { target: { value: 'spring' } });
    act(() => vi.advanceTimersByTime(200));

    const current = navigator('status=RUNNING');
    page.updateParams = current;
    rerender(<SweepstakesFilterBar filters={{ status: 'RUNNING' }} />);
    act(() => vi.advanceTimersByTime(300));

    expect(stale).not.toHaveBeenCalled();
    expect(current).toHaveReturnedTimes(1);
    expect(current).toHaveReturnedWith('status=RUNNING&search=spring');
  });

  it('does not navigate again once the URL has the typed search', () => {
    const updateParams = navigator('');
    page.updateParams = updateParams;
    const { rerender } = renderBar();

    fireEvent.change(searchBox(), { target: { value: 'spring' } });
    act(() => vi.advanceTimersByTime(300));
    page.updateParams = navigator('search=spring');
    rerender(<SweepstakesFilterBar filters={{ search: 'spring' }} />);
    act(() => vi.advanceTimersByTime(1000));

    expect(updateParams).toHaveBeenCalledTimes(1);
    expect(page.updateParams).not.toHaveBeenCalled();
    expect(searchBox()).toHaveValue('spring');
  });

  it('keeps the text typed while its earlier search loads', () => {
    page.updateParams = navigator('');
    const { rerender } = renderBar();

    fireEvent.change(searchBox(), { target: { value: 'spr' } });
    act(() => vi.advanceTimersByTime(300));
    fireEvent.change(searchBox(), { target: { value: 'spring' } });

    const current = navigator('search=spr');
    page.updateParams = current;
    rerender(<SweepstakesFilterBar filters={{ search: 'spr' }} />);

    expect(searchBox()).toHaveValue('spring');

    act(() => vi.advanceTimersByTime(300));

    expect(current).toHaveReturnedWith('search=spring');
  });

  it('shows a search that the URL changes to', () => {
    const { rerender } = renderBar({ search: 'spring' });

    rerender(<SweepstakesFilterBar filters={{ search: 'summer' }} />);

    expect(searchBox()).toHaveValue('summer');

    rerender(<SweepstakesFilterBar filters={{}} />);

    expect(searchBox()).toHaveValue('');
  });

  it('removes the search at once when the search is cleared', () => {
    const updateParams = navigator('status=RUNNING&search=spring');
    page.updateParams = updateParams;
    renderBar({ search: 'spring' });

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(updateParams).toHaveReturnedWith('status=RUNNING');
    expect(searchBox()).toHaveValue('');
    expect(
      screen.queryByRole('button', { name: 'Clear search' })
    ).not.toBeInTheDocument();
  });
});
