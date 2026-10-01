import { render } from '@testing-library/react';
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

  it('matches the snapshot on the select step', () => {
    const { container } = render(<TeamPickerForm />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
