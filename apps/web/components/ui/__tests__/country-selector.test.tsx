import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CountrySelector } from '../country-selector';

type CountrySelectorProps = React.ComponentProps<typeof CountrySelector>;

function renderSelector(props: Partial<CountrySelectorProps> = {}) {
  const onValueChange = vi.fn();
  const result = render(
    <CountrySelector onValueChange={onValueChange} {...props} />
  );
  return { ...result, onValueChange };
}

function getTrigger() {
  return screen
    .getAllByRole('combobox')
    .find((element) => element.tagName === 'BUTTON') as HTMLElement;
}

function getOptionLabels() {
  return screen.queryAllByRole('option').map((option) => option.textContent);
}

function search(query: string) {
  fireEvent.change(screen.getByPlaceholderText('Search countries...'), {
    target: { value: query }
  });
}

function waitForDebounce(milliseconds = 300) {
  act(() => {
    vi.advanceTimersByTime(milliseconds);
  });
}

describe('CountrySelector', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the default label and placeholder', () => {
    renderSelector();
    expect(screen.getByText('Country').tagName).toBe('LABEL');
    expect(getTrigger()).toHaveTextContent('Search for your country...');
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('uses a custom label and placeholder', () => {
    renderSelector({ label: 'Ship to', placeholder: 'Pick a country' });
    expect(screen.getByText('Ship to')).toBeInTheDocument();
    expect(getTrigger()).toHaveTextContent('Pick a country');
  });

  it('hides the label when asked to', () => {
    renderSelector({ hideLabel: true });
    expect(screen.queryByText('Country')).not.toBeInTheDocument();
  });

  it('shows the name of the selected country', () => {
    renderSelector({ value: 'country:US' });
    expect(getTrigger()).toHaveTextContent('United States of America');
  });

  it('lists the first ten countries when opened', async () => {
    renderSelector();
    await userEvent.click(getTrigger());
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true');
    expect(getOptionLabels()).toEqual([
      'Afghanistan',
      'Åland Islands',
      'Albania',
      'Algeria',
      'American Samoa',
      'Andorra',
      'Angola',
      'Anguilla',
      'Antarctica',
      'Antigua and Barbuda'
    ]);
  });

  it('marks the selected country with a visible check', async () => {
    renderSelector({ value: 'country:AL' });
    await userEvent.click(getTrigger());
    expect(
      screen.getByRole('option', { name: 'Albania' }).querySelector('svg')
    ).toHaveClass('opacity-100');
    expect(
      screen.getByRole('option', { name: 'Afghanistan' }).querySelector('svg')
    ).toHaveClass('opacity-0');
  });

  it('reports the picked country code and closes the list', async () => {
    const { onValueChange } = renderSelector();
    await userEvent.click(getTrigger());
    await userEvent.click(screen.getByRole('option', { name: 'Albania' }));
    expect(onValueChange).toHaveBeenCalledWith('country:AL');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('searches by name once the user pauses typing', () => {
    vi.useFakeTimers();
    renderSelector();
    fireEvent.click(getTrigger());

    search('swit');
    expect(screen.getByText('Searching...')).toBeInTheDocument();
    expect(getOptionLabels()).toEqual([]);

    waitForDebounce(299);
    expect(screen.getByText('Searching...')).toBeInTheDocument();

    waitForDebounce(1);
    expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
    expect(getOptionLabels()).toEqual(['Switzerland']);
  });

  it('restarts the pause on every keystroke', () => {
    vi.useFakeTimers();
    renderSelector();
    fireEvent.click(getTrigger());

    search('sw');
    waitForDebounce(200);
    search('swit');
    waitForDebounce(200);
    expect(screen.getByText('Searching...')).toBeInTheDocument();

    waitForDebounce(100);
    expect(getOptionLabels()).toEqual(['Switzerland']);
  });

  it('matches country codes as well as names', () => {
    vi.useFakeTimers();
    renderSelector();
    fireEvent.click(getTrigger());
    search('nz');
    waitForDebounce();
    expect(getOptionLabels()).toEqual([
      'New Zealand',
      'Tanzania, United Republic of'
    ]);
  });

  it('matches every country for fragments of the code prefix', () => {
    vi.useFakeTimers();
    renderSelector();
    fireEvent.click(getTrigger());
    search('try');
    waitForDebounce();
    const labels = getOptionLabels();
    expect(labels).toHaveLength(50);
    expect(labels[0]).toBe('Afghanistan');
  });

  it('shows an empty message when nothing matches', () => {
    vi.useFakeTimers();
    renderSelector();
    fireEvent.click(getTrigger());
    search('zzz');
    waitForDebounce();
    expect(getOptionLabels()).toEqual([]);
    expect(screen.getByText('No country found.')).toBeInTheDocument();
  });

  it('lists the first ten countries again once the search is cleared', () => {
    vi.useFakeTimers();
    renderSelector();
    fireEvent.click(getTrigger());
    search('swit');
    waitForDebounce();
    search('');
    waitForDebounce();
    expect(getOptionLabels()).toHaveLength(10);
  });

  it('adds "undefined" to the wrapper class list when no className is given', () => {
    const { container, unmount } = renderSelector();
    expect((container.firstChild as HTMLElement).className).toBe(
      'space-y-2 undefined'
    );
    unmount();

    const custom = renderSelector({ className: 'mt-4' });
    expect((custom.container.firstChild as HTMLElement).className).toBe(
      'space-y-2 mt-4'
    );
  });
});
