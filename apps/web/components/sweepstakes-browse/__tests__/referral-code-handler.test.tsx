import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setReferralCodeCookie } from '@/lib/referrals/cookies';
import { ReferralCodeHandler } from '../referral-code-handler';

const navigation = vi.hoisted(() => ({ searchParams: new URLSearchParams() }));

vi.mock('next/navigation', () => ({
  useSearchParams: () => navigation.searchParams
}));

vi.mock('@/lib/referrals/cookies', () => ({
  setReferralCodeCookie: vi.fn()
}));

describe('ReferralCodeHandler', () => {
  beforeEach(() => {
    vi.mocked(setReferralCodeCookie).mockReset();
    navigation.searchParams = new URLSearchParams();
  });

  it('renders nothing', () => {
    const { container } = render(<ReferralCodeHandler />);
    expect(container).toBeEmptyDOMElement();
  });

  it('stores the referral code from the ref search param', () => {
    navigation.searchParams = new URLSearchParams('ref=FRIEND42');
    render(<ReferralCodeHandler />);
    expect(setReferralCodeCookie).toHaveBeenCalledWith('FRIEND42');
  });

  it('does not store anything without a ref search param', () => {
    navigation.searchParams = new URLSearchParams('taskId=task-1');
    render(<ReferralCodeHandler />);
    expect(setReferralCodeCookie).not.toHaveBeenCalled();
  });

  it('ignores an empty ref search param', () => {
    navigation.searchParams = new URLSearchParams('ref=');
    render(<ReferralCodeHandler />);
    expect(setReferralCodeCookie).not.toHaveBeenCalled();
  });

  it('stores a new referral code when the search params change', () => {
    navigation.searchParams = new URLSearchParams('ref=FIRST');
    const { rerender } = render(<ReferralCodeHandler />);
    navigation.searchParams = new URLSearchParams('ref=SECOND');
    rerender(<ReferralCodeHandler />);
    expect(vi.mocked(setReferralCodeCookie).mock.calls).toEqual([
      ['FIRST'],
      ['SECOND']
    ]);
  });
});
