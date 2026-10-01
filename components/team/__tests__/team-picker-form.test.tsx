import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamPickerForm } from '../team-picker-form';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  useSearchParams: () => navigation.searchParams
}));

vi.mock('../select-team-form', () => ({
  SelectTeamForm: () => <div>Select team form</div>
}));

vi.mock('../create-team-form', () => ({
  CreateTeamForm: () => <div>Create team form</div>
}));

describe('TeamPickerForm', () => {
  beforeEach(() => {
    navigation.searchParams = new URLSearchParams();
  });

  describe('on the select step', () => {
    it('shows the select team form', () => {
      render(<TeamPickerForm />);

      expect(screen.getByText('Choose Your Team')).toBeInTheDocument();
      expect(
        screen.getByText('Select from your teams or create a new one')
      ).toBeInTheDocument();
      expect(screen.getByText('Select team form')).toBeInTheDocument();
      expect(screen.queryByText('Create team form')).not.toBeInTheDocument();
    });
  });

  describe('on the create step', () => {
    beforeEach(() => {
      navigation.searchParams = new URLSearchParams('step=2');
    });

    it('shows the create team form', () => {
      render(<TeamPickerForm />);

      expect(screen.getByText('Create your new team')).toBeInTheDocument();
      expect(screen.getByText('Create team form')).toBeInTheDocument();
      expect(screen.queryByText('Select team form')).not.toBeInTheDocument();
    });
  });

  describe('on an unknown step', () => {
    it('renders neither form for step 0', () => {
      navigation.searchParams = new URLSearchParams('step=0');

      render(<TeamPickerForm />);

      expect(screen.queryByText('Select team form')).not.toBeInTheDocument();
      expect(screen.queryByText('Create team form')).not.toBeInTheDocument();
    });
  });

  it('links to the terms of service and privacy policy', () => {
    render(<TeamPickerForm />);

    expect(
      screen.getByRole('link', { name: 'Terms of Service' })
    ).toHaveAttribute('href', '/terms');
    expect(
      screen.getByRole('link', { name: 'Privacy Policy' })
    ).toHaveAttribute('href', '/privacy');
  });

  it('merges a custom class name and forwards other props to the wrapper', () => {
    const { container } = render(
      <TeamPickerForm className="max-w-md" aria-label="Team picker" />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex', 'flex-col', 'gap-6', 'max-w-md');
    expect(wrapper).toHaveAttribute('aria-label', 'Team picker');
  });
});
