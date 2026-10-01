import { nanoid } from 'nanoid';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
import { Audience } from '../audience';

vi.mock('nanoid', () => ({ nanoid: vi.fn() }));

vi.mock('@/procedures/sweepstakes/verify-slug', () => ({ default: vi.fn() }));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

const renderAudience = () => {
  const values = buildFormValues();
  return renderWithForm(<Audience />, {
    values: {
      ...values,
      audience: {
        ...values.audience,
        formFields: [
          { id: 'field-1', type: 'USERNAME', label: 'Username', required: true }
        ]
      }
    },
    layout: { id: 'sweepstakes-1' }
  });
};

describe('Audience', () => {
  beforeEach(() => {
    vi.mocked(nanoid).mockReset().mockReturnValue('new-id');
  });

  it('matches the snapshot', () => {
    const { container } = renderAudience();
    expect(stabilizeIds(container)).toMatchSnapshot();
  });
});
