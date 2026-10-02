import { render } from '@testing-library/react';
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
});
