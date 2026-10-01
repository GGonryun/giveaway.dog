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

  it('appends the highlight when it does not appear in the text', () => {
    render(<MarketingTitle text="Hello world" highlight="!" />);
    expect(
      screen.getByRole('heading', { name: 'Hello world!' })
    ).toBeInTheDocument();
  });

  it('drops the text after a second occurrence of the highlight', () => {
    render(<MarketingTitle text="win big, win often" highlight="win" />);
    expect(
      screen.getByRole('heading', { name: 'win big,' })
    ).toBeInTheDocument();
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

  it('matches the snapshot', () => {
    const { container } = render(
      <MarketingHeader
        title={title}
        subtitle={subtitle}
        actions={[
          { label: 'Giveaways', href: '/browse', variant: 'outline' },
          { label: 'Try it for free', href: '/demo/sweepstakes' }
        ]}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
