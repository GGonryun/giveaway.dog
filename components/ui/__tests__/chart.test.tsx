import { render, screen } from '@testing-library/react';
import { Ticket } from 'lucide-react';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ChartContainer,
  ChartLegendContent,
  ChartStyle,
  ChartTooltipContent,
  type ChartConfig
} from '../chart';

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      children
  };
});

const config = {
  entries: { label: 'Entries', color: '#2563eb' },
  winners: {
    label: 'Winners',
    theme: { light: '#16a34a', dark: '#4ade80' }
  },
  total: { label: 'Total' }
} satisfies ChartConfig;

const entriesItem = {
  dataKey: 'entries',
  name: 'entries',
  value: 1200,
  color: '#2563eb',
  payload: { day: 'Mon', entries: 1200, winners: 3 }
};

const winnersItem = {
  dataKey: 'winners',
  name: 'winners',
  value: 3,
  color: '#16a34a',
  payload: { day: 'Mon', entries: 1200, winners: 3 }
};

type TooltipContentProps = React.ComponentProps<typeof ChartTooltipContent>;

function renderTooltip(props: Partial<TooltipContentProps> = {}) {
  return render(
    <ChartContainer id="entries" config={config}>
      <ChartTooltipContent
        active
        coordinate={undefined}
        accessibilityLayer={false}
        activeIndex={undefined}
        label="Mon"
        payload={[entriesItem, winnersItem]}
        {...props}
      />
    </ChartContainer>
  );
}

function getTooltip(container: HTMLElement) {
  return container.querySelector('.min-w-\\[8rem\\]');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ChartContainer', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <ChartContainer id="entries" config={config}>
        <div>Chart body</div>
      </ChartContainer>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders its children and identifies the chart', () => {
    const { container } = render(
      <ChartContainer id="entries" config={config} className="h-64">
        <div>Chart body</div>
      </ChartContainer>
    );
    const chart = container.firstChild;
    expect(chart).toHaveAttribute('data-slot', 'chart');
    expect(chart).toHaveAttribute('data-chart', 'chart-entries');
    expect(chart).toHaveClass('aspect-video', 'h-64');
    expect(screen.getByText('Chart body')).toBeInTheDocument();
  });

  it('generates a chart id without colons when none is given', () => {
    const { container } = render(
      <ChartContainer config={config}>
        <div>Chart body</div>
      </ChartContainer>
    );
    const chartId = (container.firstChild as HTMLElement).dataset.chart;
    expect(chartId).toMatch(/^chart-\S+$/);
    expect(chartId).not.toContain(':');
  });
});

describe('ChartStyle', () => {
  it('matches the snapshot', () => {
    const { container } = render(<ChartStyle id="chart-x" config={config} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('defines a color variable per configured item for each theme', () => {
    const { container } = render(<ChartStyle id="chart-x" config={config} />);
    const css = container.querySelector('style')?.innerHTML ?? '';
    expect(css).toContain('[data-chart=chart-x]');
    expect(css).toContain('.dark [data-chart=chart-x]');
    expect(css.match(/--color-entries: #2563eb;/g)).toHaveLength(2);
    expect(css).toContain('--color-winners: #16a34a;');
    expect(css).toContain('--color-winners: #4ade80;');
    expect(css).not.toContain('--color-total');
  });

  it('renders nothing when no item has a color', () => {
    const { container } = render(
      <ChartStyle id="chart-x" config={{ total: { label: 'Total' } }} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('ChartTooltipContent', () => {
  it('matches the snapshot', () => {
    const { container } = renderTooltip();
    expect(getTooltip(container)).toMatchSnapshot();
  });

  it('renders nothing while inactive', () => {
    const { container } = renderTooltip({ active: false });
    expect(getTooltip(container)).not.toBeInTheDocument();
  });

  it('renders nothing without a payload', () => {
    const { container } = renderTooltip({ payload: [] });
    expect(getTooltip(container)).not.toBeInTheDocument();
  });

  it('shows the label and every value with its configured name', () => {
    renderTooltip();
    expect(screen.getByText('Mon')).toHaveClass('font-medium');
    expect(screen.getByText('Entries')).toBeInTheDocument();
    expect(screen.getByText('1,200')).toHaveClass('font-mono');
    expect(screen.getByText('Winners')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('uses the configured label when the label matches a config key', () => {
    renderTooltip({ label: 'total', payload: [entriesItem] });
    expect(screen.getByText('Total')).toHaveClass('font-medium');
  });

  it('hides the label when asked to', () => {
    renderTooltip({ hideLabel: true });
    expect(screen.queryByText('Mon')).not.toBeInTheDocument();
  });

  it('formats the label with the label formatter', () => {
    renderTooltip({
      labelFormatter: (label) => `Day: ${label}`,
      labelClassName: 'uppercase'
    });
    expect(screen.getByText('Day: Mon')).toHaveClass('uppercase');
  });

  it('nests the label beside a single item for line indicators', () => {
    const { container } = renderTooltip({
      indicator: 'line',
      payload: [entriesItem]
    });
    const tooltip = getTooltip(container);
    expect(tooltip?.firstElementChild).not.toHaveClass('font-medium');
    expect(screen.getByText('Mon').nextElementSibling).toHaveTextContent(
      'Entries'
    );
    expect(screen.getByText('1,200').parentElement).toHaveClass('items-end');
  });

  it('shows the label above the items for dot indicators', () => {
    const { container } = renderTooltip({ payload: [entriesItem] });
    const tooltip = getTooltip(container);
    expect(tooltip?.firstElementChild).toHaveTextContent(/^Mon$/);
    expect(screen.getByText('1,200').parentElement).toHaveClass('items-center');
  });

  it('colors each indicator from the item', () => {
    const { container } = renderTooltip({ payload: [entriesItem] });
    const indicator = container.querySelector('.h-2\\.5.w-2\\.5');
    expect(indicator).toHaveStyle({ '--color-bg': '#2563eb' });
  });

  it('prefers the payload fill and then a color override for the indicator', () => {
    const filled = {
      ...entriesItem,
      payload: { ...entriesItem.payload, fill: '#f97316' }
    };
    const { container, unmount } = renderTooltip({ payload: [filled] });
    expect(container.querySelector('.h-2\\.5.w-2\\.5')).toHaveStyle({
      '--color-bg': '#f97316'
    });
    unmount();

    const overridden = renderTooltip({ payload: [filled], color: '#000000' });
    expect(overridden.container.querySelector('.h-2\\.5.w-2\\.5')).toHaveStyle({
      '--color-bg': '#000000'
    });
  });

  it('hides the indicators when asked to', () => {
    const { container } = renderTooltip({ hideIndicator: true });
    expect(container.querySelector('.h-2\\.5.w-2\\.5')).not.toBeInTheDocument();
  });

  it('renders a configured icon instead of the indicator', () => {
    const { container } = render(
      <ChartContainer
        id="entries"
        config={{ entries: { label: 'Entries', icon: Ticket } }}
      >
        <ChartTooltipContent
          active
          coordinate={undefined}
          accessibilityLayer={false}
          activeIndex={undefined}
          payload={[entriesItem]}
        />
      </ChartContainer>
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('.h-2\\.5.w-2\\.5')).not.toBeInTheDocument();
  });

  it('delegates each row to a custom formatter', () => {
    renderTooltip({
      payload: [entriesItem],
      formatter: (value: ValueType | undefined) => (
        <span>{`${value} entries`}</span>
      )
    });
    expect(screen.getByText('1200 entries')).toBeInTheDocument();
    expect(screen.queryByText('Entries')).not.toBeInTheDocument();
  });

  it('renders a zero value as bare text without the value styling', () => {
    renderTooltip({ payload: [{ ...entriesItem, value: 0 }] });
    const zero = screen.getByText('0');
    expect(zero).not.toHaveClass('font-mono');
    expect(zero).toHaveClass('justify-between');
  });

  it('throws when rendered outside a ChartContainer', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <ChartTooltipContent
          active
          coordinate={undefined}
          accessibilityLayer={false}
          activeIndex={undefined}
          payload={[entriesItem]}
        />
      )
    ).toThrow('useChart must be used within a <ChartContainer />');
  });
});

describe('ChartLegendContent', () => {
  const legendPayload = [
    { value: 'entries', dataKey: 'entries', color: '#2563eb' },
    { value: 'winners', dataKey: 'winners', color: '#16a34a' }
  ];

  function renderLegend(
    props: Partial<React.ComponentProps<typeof ChartLegendContent>> = {},
    chartConfig: ChartConfig = config
  ) {
    return render(
      <ChartContainer id="entries" config={chartConfig}>
        <ChartLegendContent payload={legendPayload} {...props} />
      </ChartContainer>
    );
  }

  it('renders nothing without a payload', () => {
    const { container } = renderLegend({ payload: [] });
    expect(container.querySelector('.justify-center.gap-4')).toBeNull();
  });

  it('renders a swatch and the configured label per item', () => {
    renderLegend();
    const entries = screen.getByText('Entries');
    expect(entries.firstElementChild).toHaveStyle({
      backgroundColor: '#2563eb'
    });
    expect(screen.getByText('Winners')).toBeInTheDocument();
  });

  it('pads the legend according to its vertical alignment', () => {
    renderLegend();
    expect(screen.getByText('Entries').parentElement).toHaveClass('pt-3');
  });

  it('pads the top legend at the bottom', () => {
    renderLegend({ verticalAlign: 'top', className: 'text-sm' });
    expect(screen.getByText('Entries').parentElement).toHaveClass(
      'pb-3',
      'text-sm'
    );
  });

  it('renders configured icons unless hideIcon is set', () => {
    const iconConfig = { entries: { label: 'Entries', icon: Ticket } };
    const { unmount } = renderLegend(
      { payload: [legendPayload[0]] },
      iconConfig
    );
    expect(
      screen.getByText('Entries').querySelector('svg')
    ).toBeInTheDocument();
    unmount();

    renderLegend({ payload: [legendPayload[0]], hideIcon: true }, iconConfig);
    expect(
      screen.getByText('Entries').querySelector('svg')
    ).not.toBeInTheDocument();
  });
});
