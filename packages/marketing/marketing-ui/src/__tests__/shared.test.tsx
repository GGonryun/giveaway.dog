import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  MarketingActions,
  MarketingHeader,
  MarketingSubtitle,
  MarketingTitle
} from '../shared';

describe('MarketingTitle', () => {
  it('highlights the default phrase in the default title', () => {
    render(<MarketingTitle />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'How creators build bigger communities'
      })
    ).toBeInTheDocument();
    expect(screen.getByText('bigger communities')).toHaveClass('text-primary');
  });

  it('highlights a phrase in the middle of a custom title', () => {
    render(
      <MarketingTitle text="Grow your audience today" highlight="audience" />
    );
    expect(
      screen.getByRole('heading', { name: 'Grow your audience today' })
    ).toBeInTheDocument();
    expect(screen.getByText('audience')).toHaveClass('text-primary');
  });

  it('renders the text unchanged when the highlight does not appear in it', () => {
    const { container } = render(
      <MarketingTitle text="Hello world" highlight="!" />
    );
    expect(
      screen.getByRole('heading', { name: 'Hello world' })
    ).toBeInTheDocument();
    expect(container.querySelector('.text-primary')).toBeNull();
  });

  it('renders the text unchanged when the highlight is empty', () => {
    const { container } = render(
      <MarketingTitle text="Hello world" highlight="" />
    );
    expect(
      screen.getByRole('heading', { name: 'Hello world' })
    ).toBeInTheDocument();
    expect(container.querySelector('.text-primary')).toBeNull();
  });

  it('highlights only the first occurrence and keeps the rest of the text', () => {
    const { container } = render(
      <MarketingTitle text="win big, win often" highlight="win" />
    );
    expect(
      screen.getByRole('heading', { name: 'win big, win often' })
    ).toBeInTheDocument();
    const highlights = container.querySelectorAll('.text-primary');
    expect(highlights).toHaveLength(1);
    expect(highlights[0]).toHaveTextContent('win');
    expect(highlights[0].previousSibling).toBeNull();
  });

  it('highlights a phrase at the end of the title', () => {
    render(<MarketingTitle text="Pick winners fairly" highlight="fairly" />);
    expect(
      screen.getByRole('heading', { name: 'Pick winners fairly' })
    ).toBeInTheDocument();
    expect(screen.getByText('fairly')).toHaveClass('text-primary');
  });
});

describe('MarketingSubtitle', () => {
  it('shows the default pitch', () => {
    render(<MarketingSubtitle />);
    expect(
      screen.getByText(
        'Host verified giveaways in under 60 seconds that grow your community without bots or spam.'
      )
    ).toBeInTheDocument();
  });

  it('shows custom text', () => {
    render(<MarketingSubtitle text="Pick winners fairly." />);
    expect(screen.getByText('Pick winners fairly.').tagName).toBe('P');
  });
});

describe('MarketingActions', () => {
  it('renders a link for each action', () => {
    render(
      <MarketingActions
        actions={[
          { label: 'Browse', href: '/browse', variant: 'outline' },
          { label: 'Start', href: '/login' }
        ]}
      />
    );
    expect(screen.getByRole('link', { name: 'Browse' })).toHaveAttribute(
      'href',
      '/browse'
    );
    expect(screen.getByRole('link', { name: 'Start' })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('uses the requested variant and falls back to the default one', () => {
    render(
      <MarketingActions
        actions={[
          { label: 'Browse', href: '/browse', variant: 'outline' },
          { label: 'Start', href: '/login' }
        ]}
      />
    );
    expect(screen.getByRole('link', { name: 'Browse' })).toHaveClass('border');
    expect(screen.getByRole('link', { name: 'Start' })).toHaveClass(
      'bg-primary'
    );
  });
});

describe('MarketingHeader', () => {
  const title = { text: 'Pick winners fairly', highlight: 'fairly' };
  const subtitle = { text: 'Random, verified and transparent.' };

  it('renders the title, subtitle and actions', () => {
    render(
      <MarketingHeader
        title={title}
        subtitle={subtitle}
        actions={[{ label: 'Try it', href: '/pickers/x' }]}
      />
    );
    expect(
      screen.getByRole('heading', { name: 'Pick winners fairly' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Random, verified and transparent.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try it' })).toHaveAttribute(
      'href',
      '/pickers/x'
    );
  });

  it('omits the actions container when there are no actions', () => {
    const { container } = render(
      <MarketingHeader title={title} subtitle={subtitle} actions={[]} />
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container.querySelector('.mt-3')).not.toBeInTheDocument();
  });
});
