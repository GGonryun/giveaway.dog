import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import { GiveawayParticipationProps } from '@/components/sweepstakes/giveaway-participation-context';
import { MockTeamProvider } from '@giveaway/team-context/mock-team-provider';
import { DEFAULT_ALLOWED_IDENTITIES } from '@giveaway/app-config/settings';
import { DeepPartial } from '@giveaway/util-types/types';
import {
  GiveawayFormSchema,
  GiveawaySchema,
  GiveawayState,
  PREVIEW_GIVEAWAY_STATES
} from '@giveaway/sweepstakes-model/schemas';
import { PreviewStateContext } from '../contexts/preview-state-context';
import {
  mockParticipant,
  mockParticipation,
  mockUserHostRelationship,
  mockUserReferral,
  onFakeAllocate,
  onFakeCompleteProfile,
  onFakeCreateReferral,
  onFakeFormSubmit,
  onFakeLogin,
  onFakeTaskComplete,
  onFakeTaskUpdate
} from '@giveaway/sweepstakes-demo/mocks';
import {
  getPreviewParticipant,
  getPreviewRelationship,
  SweepstakesFormPreview,
  SweepstakesSharedFormPreview
} from '../sweepstakes-editor-preview';
import {
  buildFormValues,
  FIXED_NOW,
  renderWithForm
} from '@giveaway/sweepstakes-editor-setup/testing/form-harness';

vi.mock('@/components/sweepstakes/giveaway-participation', () => ({
  GiveawayParticipation: vi.fn(() => <div>Giveaway participation</div>)
}));

const ALL_STATES: GiveawayState[] = [
  'active',
  'pending',
  'not-logged-in',
  'not-eligible',
  'profile-incomplete',
  'winners-announced',
  'winners-pending',
  'no-prize-allocation',
  'closed',
  'canceled',
  'error'
];

const prizes = [
  { prizeId: 'prize-1', prizeName: 'Gift Card', quota: 1, draws: [] },
  { prizeId: 'prize-2', prizeName: 'Sticker Pack', quota: 3, draws: [] }
];

const buildSweepstakes = (allowUserSelection: boolean): GiveawaySchema => {
  const values = buildFormValues();
  return {
    ...values,
    id: 'sweepstakes-1',
    status: 'RUNNING',
    criteria: { ...values.criteria, allowUserSelection }
  };
};

const lastProps = (): GiveawayParticipationProps => {
  const call = vi.mocked(GiveawayParticipation).mock.lastCall;
  if (!call) throw new Error('GiveawayParticipation was not rendered');
  return call[0];
};

const PreviewProviders = ({
  state,
  children
}: {
  state: GiveawayState;
  children: React.ReactNode;
}) => (
  <MockTeamProvider>
    <PreviewStateContext.Provider
      value={{ previewState: state, setPreviewState: () => {} }}
    >
      {children}
    </PreviewStateContext.Provider>
  </MockTeamProvider>
);

const renderShared = (
  formValues: DeepPartial<GiveawayFormSchema>,
  state: GiveawayState = 'active'
) =>
  render(
    <PreviewProviders state={state}>
      <SweepstakesSharedFormPreview formValues={formValues} />
    </PreviewProviders>
  );

describe('getPreviewParticipant', () => {
  it.each(['not-logged-in', 'profile-incomplete'] as const)(
    'has no participant in the %s state',
    (state) => {
      expect(
        getPreviewParticipant(buildSweepstakes(true), prizes, state)
      ).toBeUndefined();
    }
  );

  it('has no allocation in the no-prize-allocation state', () => {
    expect(
      getPreviewParticipant(
        buildSweepstakes(true),
        prizes,
        'no-prize-allocation'
      )
    ).toEqual({ ...mockParticipant, allocation: null });
  });

  it.each(
    ALL_STATES.filter(
      (state) =>
        ![
          'not-logged-in',
          'profile-incomplete',
          'no-prize-allocation'
        ].includes(state)
    )
  )(
    'allocates the first prize in the %s state when prizes can be chosen',
    (state) => {
      expect(
        getPreviewParticipant(buildSweepstakes(true), prizes, state)
      ).toEqual({
        ...mockParticipant,
        allocation: { prize: { id: 'prize-1', name: 'Gift Card' } }
      });
    }
  );

  it('does not allocate a prize when prizes cannot be chosen', () => {
    expect(
      getPreviewParticipant(buildSweepstakes(false), prizes, 'active')
    ).toEqual({ ...mockParticipant, allocation: null });
  });

  it('has an undefined allocation when there are no prizes', () => {
    expect(getPreviewParticipant(buildSweepstakes(true), [], 'active')).toEqual(
      { ...mockParticipant, allocation: undefined }
    );
  });

  it('throws for an unknown state', () => {
    expect(() =>
      getPreviewParticipant(
        buildSweepstakes(true),
        prizes,
        'archived' as GiveawayState
      )
    ).toThrow('Unexpected value: archived');
  });
});

describe('getPreviewRelationship', () => {
  it('has no relationship when the user is not logged in', () => {
    expect(getPreviewRelationship('not-logged-in')).toBeUndefined();
  });

  it.each(ALL_STATES.filter((state) => state !== 'not-logged-in'))(
    'uses the mock relationship in the %s state',
    (state) => {
      expect(getPreviewRelationship(state)).toBe(mockUserHostRelationship);
    }
  );

  it('throws for an unknown state', () => {
    expect(() => getPreviewRelationship('archived' as GiveawayState)).toThrow(
      'Unexpected value: archived'
    );
  });
});

describe('SweepstakesSharedFormPreview', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_NOW);
    vi.mocked(GiveawayParticipation).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the form is empty', () => {
    it('shows the loading skeleton', () => {
      renderShared({});
      expect(screen.getByText('Preview Banner')).toBeInTheDocument();
      expect(GiveawayParticipation).not.toHaveBeenCalled();
    });
  });

  describe('when the form has no name, tasks or prizes', () => {
    it('asks to finish the setup', () => {
      renderShared({ setup: { name: '' }, tasks: [], prizes: [] });
      expect(
        screen.getByRole('heading', { name: 'Setup Your Giveaway' })
      ).toBeInTheDocument();
      expect(GiveawayParticipation).not.toHaveBeenCalled();
    });
  });

  describe('when the form only has a name', () => {
    it('defaults the dates to a week starting now', () => {
      renderShared({ setup: { name: 'Summer Giveaway' } });
      expect(lastProps().sweepstakes.timing).toEqual({
        startDate: FIXED_NOW,
        endDate: new Date('2026-06-22T12:00:00.000Z'),
        timeZone: 'UTC'
      });
    });
  });

  describe('when the form is complete', () => {
    const values = buildFormValues({
      visibility: { visibility: 'PUBLIC', slug: 'summer' }
    });

    it('previews the sweepstakes built from the form', () => {
      renderShared(values);
      const { sweepstakes } = lastProps();

      expect(sweepstakes).toMatchObject({
        id: 'preview-sweepstakes-id',
        status: 'RUNNING',
        setup: values.setup,
        timing: values.timing,
        tasks: values.tasks,
        prizes: values.prizes,
        design: values.design,
        visibility: { visibility: 'PUBLIC', slug: 'summer' },
        criteria: values.criteria,
        audience: {
          allowedIdentities: DEFAULT_ALLOWED_IDENTITIES,
          requirePreEntryLogin: false,
          regionalRestriction: undefined,
          formFields: []
        }
      });
    });

    it('previews as the active team with the mock participation', () => {
      renderShared(values);
      expect(lastProps()).toMatchObject({
        host: {
          id: 'demo-team-id',
          slug: 'demo-team',
          name: 'Demo Team',
          logo: '🎮'
        },
        participation: mockParticipation,
        referral: mockUserReferral,
        isPreview: true,
        verifyEmail: false
      });
    });

    it('turns the form prizes into prize summaries', () => {
      renderShared({
        ...values,
        prizes: [
          { id: 'prize-1', name: 'Gift Card', quota: 2 },
          { name: '', quota: 0 }
        ]
      });
      expect(lastProps().prizes).toEqual([
        { prizeId: 'prize-1', prizeName: 'Gift Card', quota: 2, draws: [] },
        { prizeId: 'prize-2', prizeName: 'Prize 2', quota: 1, draws: [] }
      ]);
    });

    it.each(PREVIEW_GIVEAWAY_STATES)(
      'previews the %s state for the matching participant',
      (state) => {
        renderShared(values, state);
        const props = lastProps();
        expect(props.state).toBe(state);
        expect(props.participant).toEqual(
          getPreviewParticipant(props.sweepstakes, props.prizes, state)
        );
        expect(props.relationship).toEqual(getPreviewRelationship(state));
      }
    );

    it('uses fake handlers so the preview never calls the server', () => {
      renderShared(values);
      expect(lastProps()).toMatchObject({
        onAllocate: onFakeAllocate,
        onCreateReferral: onFakeCreateReferral,
        onTaskComplete: onFakeTaskComplete,
        onTaskUpdate: onFakeTaskUpdate,
        onLogin: onFakeLogin,
        onCompleteProfile: onFakeCompleteProfile,
        onFormSubmit: onFakeFormSubmit
      });
    });
  });

  describe('terms', () => {
    it('previews custom terms with their text', () => {
      renderShared({
        setup: { name: 'Summer Giveaway' },
        terms: { type: 'CUSTOM', text: '<p>House rules</p>' }
      });
      expect(lastProps().sweepstakes.terms).toEqual({
        type: 'CUSTOM',
        text: '<p>House rules</p>'
      });
    });

    it('previews empty custom terms when the terms are missing', () => {
      renderShared({ setup: { name: 'Summer Giveaway' } });
      expect(lastProps().sweepstakes.terms).toEqual({
        type: 'CUSTOM',
        text: ''
      });
    });

    it('previews template terms', () => {
      renderShared({
        setup: { name: 'Summer Giveaway' },
        terms: { type: 'TEMPLATE', sponsorName: 'Acme Inc' }
      });
      expect(lastProps().sweepstakes.terms).toMatchObject({ type: 'TEMPLATE' });
    });

    it.fails('keeps the sponsor name of the host in template terms', () => {
      renderShared({
        setup: { name: 'Summer Giveaway' },
        terms: { type: 'TEMPLATE', sponsorName: 'Acme Inc' }
      });
      expect(lastProps().sweepstakes.terms).toMatchObject({
        sponsorName: 'Acme Inc'
      });
    });
  });

  describe('audience', () => {
    it('fills a partial regional restriction', () => {
      renderShared({
        setup: { name: 'Summer Giveaway' },
        audience: { regionalRestriction: { regions: undefined } }
      });
      expect(lastProps().sweepstakes.audience.regionalRestriction).toEqual({
        regions: [],
        filter: 'INCLUDE'
      });
    });

    it('keeps a complete regional restriction', () => {
      renderShared({
        setup: { name: 'Summer Giveaway' },
        audience: {
          regionalRestriction: { regions: ['country:CA'], filter: 'EXCLUDE' }
        }
      });
      expect(lastProps().sweepstakes.audience.regionalRestriction).toEqual({
        regions: ['country:CA'],
        filter: 'EXCLUDE'
      });
    });

    it('fills the custom form fields with defaults and drops untyped fields', () => {
      renderShared({
        setup: { name: 'Summer Giveaway' },
        audience: {
          formFields: [
            { id: 'username', type: 'USERNAME', label: 'Username' },
            {
              id: 'email',
              type: 'EMAIL',
              label: 'Email',
              placeholder: 'you@x.y'
            },
            { id: 'age', type: 'AGE', label: 'Age', required: true },
            { id: 'twitter', type: 'TWITTER', label: 'Twitter' },
            { id: 'untyped', label: 'Untyped' }
          ]
        }
      });
      expect(lastProps().sweepstakes.audience.formFields).toEqual([
        {
          id: 'username',
          label: 'Username',
          type: 'USERNAME',
          required: false,
          placeholder: ''
        },
        { id: 'email', label: 'Email', type: 'EMAIL', placeholder: 'you@x.y' },
        {
          id: 'age',
          label: 'Age',
          type: 'AGE',
          required: true,
          minimum: 16,
          maximum: 99
        },
        {
          id: 'twitter',
          label: 'Twitter',
          type: 'TWITTER',
          required: false,
          placeholder: 'https://x.com/TheGiveawayDog'
        }
      ]);
    });
  });

  describe('criteria and design fallbacks', () => {
    it('falls back to a quality score of 50 when the score is 0', () => {
      renderShared({
        setup: { name: 'Summer Giveaway' },
        criteria: { minQualityScore: 0 }
      });
      expect(lastProps().sweepstakes.criteria.minQualityScore).toBe(50);
    });

    it('only hides the name and description when they are turned off', () => {
      renderShared({
        setup: { name: 'Summer Giveaway' },
        design: { displayName: false }
      });
      expect(lastProps().sweepstakes.design).toMatchObject({
        displayName: false,
        displayDescription: true
      });
    });
  });
});

describe('SweepstakesFormPreview', () => {
  beforeEach(() => {
    vi.mocked(GiveawayParticipation).mockClear();
  });

  it('previews the current form values', () => {
    const { form } = renderWithForm(
      <PreviewProviders state="active">
        <SweepstakesFormPreview />
      </PreviewProviders>
    );
    expect(lastProps().sweepstakes.setup.name).toBe('Summer Giveaway');

    act(() => form.setValue('setup.name', 'Winter Giveaway'));
    expect(lastProps().sweepstakes.setup.name).toBe('Winter Giveaway');
  });
});
