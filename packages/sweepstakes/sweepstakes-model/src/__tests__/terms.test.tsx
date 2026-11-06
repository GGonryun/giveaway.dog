import { describe, expect, it } from 'vitest';
import {
  defaultTermInputOptions,
  defaultTermOptions,
  giveawayTerms,
  stringifyTerms,
  SweepstakesTermOptions,
  toEligibilityAge,
  toEligibilityRegions,
  toEligibilityTermOptions
} from '../terms';

const buildOptions = (
  overrides: Partial<SweepstakesTermOptions> = {}
): SweepstakesTermOptions => ({
  sweepstakesName: 'Summer Giveaway',
  eligibilityRegions: 'worldwide',
  startDate: 'July 1, 2026',
  endDate: 'July 15, 2026',
  entryUrl: 'https://giveaway.dog/browse/summer',
  prizes: [
    { name: 'Gift Card', quota: 1 },
    { name: 'Sticker Pack', quota: 3 }
  ],
  sponsorName: 'Acme Inc',
  sponsorAddress: '1 Main St, Springfield',
  winnerSelectionMethod: 'Random Drawing',
  notificationTimeframeDays: 7,
  claimDeadlineDays: 14,
  governingLawCountry: 'Canada',
  privacyPolicyUrl: 'https://acme.test/privacy',
  additionalTerms: 'Void where prohibited.',
  ...overrides
});

describe('giveawayTerms', () => {
  describe('sponsor', () => {
    it('includes the sponsor address when one is given', () => {
      expect(giveawayTerms(buildOptions()).sponsor).toBe(
        'The Sweepstakes (“Promotion”) is sponsored by Acme Inc, located at 1 Main St, Springfield (“Sponsor”). For inquiries or winner requests, contact the Sponsor.'
      );
    });

    it.each([null, undefined, ''])(
      'omits the address when it is %s',
      (sponsorAddress) => {
        expect(giveawayTerms(buildOptions({ sponsorAddress })).sponsor).toBe(
          'The Sweepstakes (“Promotion”) is sponsored by Acme Inc (“Sponsor”). For inquiries or winner requests, contact the Sponsor.'
        );
      }
    );
  });

  describe('eligibility', () => {
    it('limits the promotion to an age when one is given', () => {
      const { eligibility } = giveawayTerms(
        buildOptions({ eligibilityAge: '18' })
      );
      expect(eligibility).toContain(
        'The Promotion is open worldwide to individuals 18+ years of age'
      );
    });

    it('opens the promotion to all individuals without an age', () => {
      const { eligibility } = giveawayTerms(buildOptions());
      expect(eligibility).toContain(
        'The Promotion is open worldwide to all individuals, unless restricted by local law.'
      );
    });
  });

  it('describes the entry period with both dates', () => {
    expect(giveawayTerms(buildOptions()).entryPeriod).toBe(
      'The Promotion begins on July 1, 2026 and ends on July 15, 2026. Entries received outside this period will not be accepted.'
    );
  });

  describe('howToEnter', () => {
    it('adds an entry limit when maxEntriesPerUser is set', () => {
      expect(
        giveawayTerms(buildOptions({ maxEntriesPerUser: 5 })).howToEnter
      ).toContain(
        'Enter via https://giveaway.dog/browse/summer. Limit 5 entries per person. Automated'
      );
    });

    it.each([null, undefined, 0])(
      'leaves out the entry limit when maxEntriesPerUser is %s',
      (maxEntriesPerUser) => {
        const { howToEnter } = giveawayTerms(
          buildOptions({ maxEntriesPerUser })
        );
        expect(howToEnter).not.toContain('Limit');
        expect(howToEnter).toContain(
          'Enter via https://giveaway.dog/browse/summer. Automated'
        );
      }
    );
  });

  describe('prizes', () => {
    it('lists each prize with a pluralized winner count', () => {
      expect(giveawayTerms(buildOptions()).prizes).toBe(
        "Prizes:\n\t- 1 winner will receive 'Gift Card'\n\t- 3 winners will receive 'Sticker Pack'\n\nPrizes are non-transferable and non-redeemable for cash unless permitted by the Sponsor. All taxes and expenses related to the prize are the responsibility of the Winner."
      );
    });

    it('keeps the prize heading when there are no prizes', () => {
      expect(giveawayTerms(buildOptions({ prizes: [] })).prizes).toMatch(
        /^Prizes:\n\n\nPrizes are non-transferable/
      );
    });
  });

  describe('winnerSelection', () => {
    it('pluralizes the notification and claim periods', () => {
      expect(giveawayTerms(buildOptions()).winnerSelection).toBe(
        'Winner(s) will be selected by Random Drawing. Winners will be notified within 7 days using the contact information provided. Winners must claim their prize within 14 days or an alternate winner may be chosen.'
      );
    });

    it('uses the singular day for one-day periods', () => {
      const { winnerSelection } = giveawayTerms(
        buildOptions({ notificationTimeframeDays: 1, claimDeadlineDays: 1 })
      );
      expect(winnerSelection).toContain('notified within 1 day using');
      expect(winnerSelection).toContain('within 1 day or an alternate');
    });
  });

  describe('privacy', () => {
    it('mentions the sponsor privacy policy when a URL is given', () => {
      expect(giveawayTerms(buildOptions()).privacy).toBe(
        'Your information is governed by our privacy policy (https://giveaway.dog/privacy), and the Sponsor privacy policy (https://acme.test/privacy). '
      );
    });

    it.each([null, undefined, ''])(
      'only mentions the platform policy when the URL is %s',
      (privacyPolicyUrl) => {
        expect(giveawayTerms(buildOptions({ privacyPolicyUrl })).privacy).toBe(
          'Your information is governed by our privacy policy (https://giveaway.dog/privacy). '
        );
      }
    );
  });

  it('uses the governing law country for disputes', () => {
    expect(giveawayTerms(buildOptions()).disputes).toBe(
      'This Promotion is governed by the laws of Canada. All disputes shall be resolved individually (not as part of a class action) and exclusively in the courts located in Canada.'
    );
  });

  it.each([null, undefined, ''])(
    'returns empty additional terms when they are %s',
    (additionalTerms) => {
      expect(
        giveawayTerms(buildOptions({ additionalTerms })).additionalTerms
      ).toBe('');
    }
  );

  it('titles the rules with the sweepstakes name', () => {
    expect(giveawayTerms(buildOptions()).heading).toBe(
      'OFFICIAL RULES - Summer Giveaway'
    );
  });
});

describe('stringifyTerms', () => {
  it('leaves out the heading', () => {
    expect(stringifyTerms(buildOptions())).not.toContain('OFFICIAL RULES');
  });

  it('starts with the no purchase notice and ends with the additional terms', () => {
    const sections = stringifyTerms(buildOptions()).split('\n\n');
    expect(sections[0]).toBe(
      'NO PURCHASE IS NECESSARY TO ENTER OR WIN. A PURCHASE DOES NOT INCREASE YOUR CHANCES OF WINNING.'
    );
    expect(sections[sections.length - 1]).toBe('Void where prohibited.');
  });

  it('orders the sections as in the official rules', () => {
    const terms = giveawayTerms(buildOptions());
    const output = stringifyTerms(buildOptions());
    const positions = [
      terms.noPurchaseNotice,
      terms.sponsor,
      terms.eligibility,
      terms.agreementToRules,
      terms.entryPeriod,
      terms.howToEnter,
      terms.prizes,
      terms.odds,
      terms.winnerSelection,
      terms.rights,
      terms.termsAndConditions,
      terms.liability,
      terms.disputes,
      terms.winnersList,
      terms.platformDisclaimer,
      terms.privacy,
      terms.additionalTerms
    ].map((section) => output.indexOf(section));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('uses the placeholder options by default', () => {
    expect(stringifyTerms()).toBe(stringifyTerms(defaultTermOptions));
    expect(stringifyTerms()).toContain('sponsored by <Sponsor Name>');
  });
});

describe('defaultTermInputOptions', () => {
  it('provides placeholder values for every template input', () => {
    expect(defaultTermInputOptions).toEqual({
      sponsorName: '<Sponsor Name>',
      sponsorAddress: '<Sponsor Address>',
      winnerSelectionMethod: 'Randomly Draw',
      notificationTimeframeDays: 7,
      claimDeadlineDays: 7,
      governingLawCountry: 'USA',
      privacyPolicyUrl: '',
      additionalTerms: ''
    });
  });
});

describe('toEligibilityRegions', () => {
  it('says globally without a regional restriction', () => {
    expect(toEligibilityRegions(null)).toBe('globally');
    expect(toEligibilityRegions(undefined)).toBe('globally');
  });

  it('names the included regions', () => {
    expect(
      toEligibilityRegions({
        regions: ['country:US', 'country:CA'],
        filter: 'INCLUDE'
      })
    ).toBe('to residents of: United States of America, Canada');
  });

  it('names the excluded regions', () => {
    expect(
      toEligibilityRegions({ regions: ['country:US'], filter: 'EXCLUDE' })
    ).toBe('globally (excluding: United States of America)');
  });
});

describe('toEligibilityAge', () => {
  it('is undefined without an Age field', () => {
    expect(toEligibilityAge([])).toBeUndefined();
    expect(
      toEligibilityAge([{ id: 'f1', label: 'Email', type: 'EMAIL' }])
    ).toBeUndefined();
  });

  it('is the minimum of the Age field', () => {
    expect(
      toEligibilityAge([
        { id: 'f1', label: 'Email', type: 'EMAIL' },
        { id: 'f2', label: 'Age', type: 'AGE', minimum: 18, required: true }
      ])
    ).toBe('18');
  });

  it.each([null, undefined])(
    'is undefined when the Age field has a minimum of %s',
    (minimum) => {
      expect(
        toEligibilityAge([
          { id: 'f1', label: 'Age', type: 'AGE', minimum, required: true }
        ])
      ).toBeUndefined();
    }
  );
});

describe('toEligibilityTermOptions', () => {
  it('builds the eligibility sentence from the audience', () => {
    const terms = giveawayTerms(
      buildOptions(
        toEligibilityTermOptions({
          regionalRestriction: { regions: ['country:US'], filter: 'INCLUDE' },
          formFields: [
            { id: 'f1', label: 'Age', type: 'AGE', minimum: 21, required: true }
          ]
        })
      )
    );

    expect(terms.eligibility).toContain(
      'The Promotion is open to residents of: United States of America to individuals 21+ years of age'
    );
  });
});
