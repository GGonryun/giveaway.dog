import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ChartContainer,
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
});

describe('ChartStyle', () => {
  it('matches the snapshot', () => {
    const { container } = render(<ChartStyle id="chart-x" config={config} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('ChartTooltipContent', () => {
  it('matches the snapshot', () => {
    const { container } = renderTooltip();
    expect(getTooltip(container)).toMatchSnapshot();
  });
});
