import { render, screen } from '@testing-library/react';
import { Trophy, Users } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from '../empty-state';

const trackedItems = [
  {
    icon: Users,
    iconColor: 'text-blue-500',
    title: 'Entries',
    description: 'Every entry submitted to your giveaway'
  },
  {
    icon: Trophy,
    iconColor: 'text-amber-500',
    title: 'Winners',
    description: 'Winners drawn when the giveaway ends'
  }
];

function renderEmptyState(items = trackedItems) {
  return render(
    <EmptyState
      title="No data yet"
      description="Analytics appear once people start entering."
      alertMessage="Data refreshes every hour."
      trackedItems={items}
      footerMessage="Share your giveaway to get started."
    />
  );
}

describe('EmptyState', () => {
  it('matches the snapshot', () => {
    const { container } = renderEmptyState();
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders the title, description and footer message', () => {
    renderEmptyState();
    expect(screen.getByText('No data yet')).toHaveAttribute(
      'data-slot',
      'card-title'
    );
    expect(
      screen.getByText('Analytics appear once people start entering.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Share your giveaway to get started.')
    ).toBeInTheDocument();
  });

  it('shows the alert message inside an alert', () => {
    renderEmptyState();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Data refreshes every hour.'
    );
  });

  it('lists every tracked item with its title and description', () => {
    renderEmptyState();
    expect(screen.getByText("What we're tracking:")).toBeInTheDocument();
    expect(screen.getByText('Entries')).toBeInTheDocument();
    expect(
      screen.getByText('Every entry submitted to your giveaway')
    ).toBeInTheDocument();
    expect(screen.getByText('Winners')).toBeInTheDocument();
    expect(
      screen.getByText('Winners drawn when the giveaway ends')
    ).toBeInTheDocument();
  });

  it('renders each tracked item icon with its color', () => {
    const { container } = renderEmptyState();
    expect(container.querySelector('svg.text-blue-500')).toBeInTheDocument();
    expect(container.querySelector('svg.text-amber-500')).toBeInTheDocument();
  });

  it('renders no tracked items when the list is empty', () => {
    renderEmptyState([]);
    expect(screen.getByText("What we're tracking:")).toBeInTheDocument();
    expect(screen.queryByText('Entries')).not.toBeInTheDocument();
  });
});
