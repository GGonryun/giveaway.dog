import { describe, expect, it } from 'vitest';
import {
  E2E_MAX_DRAWS,
  E2E_MAX_ENTRIES,
  E2E_MAX_FORM_FIELDS,
  E2E_MAX_FORM_VALUE_LENGTH,
  E2E_MAX_REASON_LENGTH,
  E2E_MAX_REFERRALS,
  E2E_MAX_REGIONS,
  E2E_MAX_TASKS,
  E2E_MAX_TERMS_LENGTH,
  e2eSweepstakesRequestSchema,
  toE2eEntryNamespace
} from '../requests';

const base = { ns: 'abc123w0', team: 'e2e-abc123-w0' };

const parse = (request: Record<string, unknown>) =>
  e2eSweepstakesRequestSchema.safeParse({ ...base, ...request });

const issuesOf = (request: Record<string, unknown>) =>
  parse(request).error?.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`
  ) ?? [];

const pathsOf = (request: Record<string, unknown>) =>
  parse(request).error?.issues.map((issue) => issue.path.join('.')) ?? [];

const entry = (fields: Record<string, unknown> = {}) => ({
  persona: 'participant',
  completions: [{ task: 0 }],
  ...fields
});

const many = <T>(count: number, make: (index: number) => T) =>
  Array.from({ length: count }, (_, index) => make(index));

const TWO_TASKS = [{ type: 'BONUS_TASK' }, { type: 'REFERRAL_LINK' }];
const TWO_PRIZES = [{ name: 'A mug' }, { name: 'A hat' }];

describe('e2eSweepstakesRequestSchema terms', () => {
  it('accepts custom terms with raw HTML', () => {
    const terms = { type: 'CUSTOM', text: '<img src=x onerror=alert(1)>' };

    expect(parse({ terms }).data?.terms).toEqual(terms);
  });

  it('accepts some fields of the template', () => {
    const terms = {
      type: 'TEMPLATE',
      sponsorName: 'Acme',
      claimDeadlineDays: 7
    };

    expect(parse({ terms }).data?.terms).toEqual(terms);
  });

  it('rejects empty custom terms', () => {
    expect(pathsOf({ terms: { type: 'CUSTOM', text: '' } })).toEqual([
      'terms.text'
    ]);
  });

  it(`rejects custom terms longer than ${E2E_MAX_TERMS_LENGTH} characters`, () => {
    const text = 'x'.repeat(E2E_MAX_TERMS_LENGTH);

    expect(parse({ terms: { type: 'CUSTOM', text } }).success).toBe(true);
    expect(pathsOf({ terms: { type: 'CUSTOM', text: `${text}x` } })).toEqual([
      'terms.text'
    ]);
  });

  it(`rejects additional terms longer than ${E2E_MAX_TERMS_LENGTH} characters`, () => {
    const additionalTerms = 'x'.repeat(E2E_MAX_TERMS_LENGTH);
    const terms = { type: 'TEMPLATE', additionalTerms };

    expect(parse({ terms }).success).toBe(true);
    expect(
      pathsOf({ terms: { ...terms, additionalTerms: `${additionalTerms}x` } })
    ).toEqual(['terms.additionalTerms']);
  });

  it('rejects an unknown field and an unknown type', () => {
    expect(
      pathsOf({ terms: { type: 'CUSTOM', text: 'Terms', sponsorName: 'A' } })
    ).toEqual(['terms']);
    expect(pathsOf({ terms: { type: 'OTHER' } })).toEqual(['terms.type']);
  });
});

describe('e2eSweepstakesRequestSchema criteria', () => {
  it('accepts some of the winner criteria', () => {
    const criteria = { minQualityScore: 0, allowMultipleWins: true };

    expect(parse({ criteria }).data?.criteria).toEqual(criteria);
  });

  it('rejects a quality score above 100 and the external platforms', () => {
    expect(pathsOf({ criteria: { minQualityScore: 101 } })).toEqual([
      'criteria.minQualityScore'
    ]);
    expect(pathsOf({ criteria: { externalPlatforms: [] } })).toEqual([
      'criteria'
    ]);
  });
});

describe('e2eSweepstakesRequestSchema audience', () => {
  it('accepts the identities, the pre-entry login, a region and form fields', () => {
    const audience = {
      allowedIdentities: ['ANONYMOUS', 'EMAIL'],
      requirePreEntryLogin: true,
      regionalRestriction: {
        regions: ['country:US', 'continent:EU'],
        filter: 'INCLUDE'
      },
      formFields: [
        { type: 'AGE', label: 'Age', minimum: 18, required: true },
        { type: 'EMAIL', label: 'Email' }
      ]
    };

    expect(parse({ audience }).data?.audience).toEqual(audience);
  });

  it('accepts no regional restriction, to remove it', () => {
    expect(
      parse({ audience: { regionalRestriction: null } }).data?.audience
    ).toEqual({ regionalRestriction: null });
  });

  it('rejects an unknown identity and no identity', () => {
    expect(pathsOf({ audience: { allowedIdentities: ['MYSPACE'] } })).toEqual([
      'audience.allowedIdentities.0'
    ]);
    expect(pathsOf({ audience: { allowedIdentities: [] } })).toEqual([
      'audience.allowedIdentities'
    ]);
  });

  it.each(['US', 'country:us', 'planet:EA', 'country:USA', 'xcountry:US'])(
    'rejects the region %s',
    (region) => {
      expect(
        pathsOf({
          audience: {
            regionalRestriction: { regions: [region], filter: 'EXCLUDE' }
          }
        })
      ).toEqual(['audience.regionalRestriction.regions.0']);
    }
  );

  it('rejects a regional restriction with no region', () => {
    expect(
      pathsOf({
        audience: { regionalRestriction: { regions: [], filter: 'INCLUDE' } }
      })
    ).toEqual(['audience.regionalRestriction.regions']);
  });

  it(`accepts ${E2E_MAX_REGIONS} regions and no more`, () => {
    const regions = many(E2E_MAX_REGIONS, () => 'country:US');
    const restriction = { regions, filter: 'INCLUDE' };

    expect(
      parse({ audience: { regionalRestriction: restriction } }).success
    ).toBe(true);
    expect(
      pathsOf({
        audience: {
          regionalRestriction: {
            ...restriction,
            regions: [...regions, 'country:US']
          }
        }
      })
    ).toEqual(['audience.regionalRestriction.regions']);
  });

  it(`accepts ${E2E_MAX_FORM_FIELDS} form fields and no more`, () => {
    const formFields = many(E2E_MAX_FORM_FIELDS, () => ({
      type: 'EMAIL',
      label: 'Email'
    }));

    expect(parse({ audience: { formFields } }).success).toBe(true);
    expect(
      pathsOf({ audience: { formFields: [...formFields, formFields[0]] } })
    ).toEqual(['audience.formFields']);
  });

  it.each([
    { type: 'USERNAME', label: 'Name', placeholder: 'alice' },
    { type: 'AGE', label: 'Age', maximum: 99 },
    { type: 'EMAIL', label: 'Email' },
    { type: 'TWITTER', label: 'X profile', placeholder: null }
  ])(
    'accepts a $type form field without an id, and refuses one with an id',
    (field) => {
      expect(parse({ audience: { formFields: [field] } }).success).toBe(true);
      expect(
        pathsOf({ audience: { formFields: [{ ...field, id: 'f-1' }] } })
      ).toEqual(['audience.formFields.0']);
    }
  );

  it('rejects a form field with an id or an unknown type', () => {
    expect(
      pathsOf({
        audience: { formFields: [{ id: 'f', type: 'EMAIL', label: 'E' }] }
      })
    ).toEqual(['audience.formFields.0']);
    expect(
      pathsOf({ audience: { formFields: [{ type: 'PHONE', label: 'P' }] } })
    ).toEqual(['audience.formFields.0.type']);
  });
});

describe('e2eSweepstakesRequestSchema entries', () => {
  it('fills in the defaults of an entry', () => {
    expect(
      parse({ entries: [{ persona: 'participant' }] }).data?.entries
    ).toEqual([{ persona: 'participant', completions: [], formValues: [] }]);
    expect(parse({ entries: [entry()] }).data?.entries[0].completions).toEqual([
      { task: 0, status: 'COMPLETED' }
    ]);
  });

  it('accepts completions in each status, form values, a score and a prize', () => {
    const request = {
      tasks: TWO_TASKS,
      prizes: TWO_PRIZES,
      criteria: { allowUserSelection: true },
      audience: { formFields: [{ type: 'EMAIL', label: 'Email' }] },
      entries: [
        {
          persona: 'participant',
          ns: 'abc123p1',
          completions: [
            { task: 0, status: 'PENDING', proof: { answer: 'yes' } },
            { task: 1, status: 'REJECTED', reason: 'Fake' }
          ],
          formValues: [{ field: 0, value: 'not an email' }],
          quality: 100,
          prize: 1
        }
      ]
    };

    expect(parse(request).data?.entries).toEqual(request.entries);
  });

  it('uses the namespace of the giveaway for an entry without one', () => {
    expect(toE2eEntryNamespace(base, {})).toBe('abc123w0');
    expect(toE2eEntryNamespace(base, { ns: 'abc123zz' })).toBe('abc123zz');
  });

  it('rejects an entry namespace outside the run of the giveaway', () => {
    expect(issuesOf({ entries: [entry({ ns: 'xyz789' })] })).toEqual([
      'entries.0.ns: The namespace must start with abc123'
    ]);
  });

  it('accepts an entry namespace of the run when the giveaway namespace is short', () => {
    expect(
      e2eSweepstakesRequestSchema.safeParse({
        ...base,
        ns: 'abcd',
        entries: [entry({ ns: 'abcdef' })]
      }).success
    ).toBe(true);
  });

  it('rejects a persona that enters twice in one namespace', () => {
    expect(
      issuesOf({
        entries: [
          entry(),
          entry({ persona: 'participant2' }),
          entry({ ns: 'abc123w0' })
        ]
      })
    ).toEqual([
      'entries.2: Each persona and namespace enters the giveaway at most once'
    ]);
  });

  it('accepts one persona in two namespaces', () => {
    expect(
      parse({ entries: [entry({ ns: 'abc123p1' }), entry({ ns: 'abc123p2' })] })
        .success
    ).toBe(true);
  });

  it('rejects a completion of a task that does not exist', () => {
    expect(
      issuesOf({ entries: [entry({ completions: [{ task: 1 }] })] })
    ).toEqual(['entries.0.completions.0.task: There is no task at index 1']);
  });

  it('rejects two completions of one task', () => {
    expect(
      issuesOf({
        tasks: TWO_TASKS,
        entries: [
          entry({ completions: [{ task: 0 }, { task: 1 }, { task: 1 }] })
        ]
      })
    ).toEqual([
      'entries.0.completions.2: Each task has at most one completion for each entry'
    ]);
  });

  it('rejects a value of a form field that does not exist', () => {
    expect(
      issuesOf({ entries: [entry({ formValues: [{ field: 0, value: 'a' }] })] })
    ).toEqual([
      'entries.0.formValues.0.field: There is no form field at index 0'
    ]);
  });

  it('rejects two values of one form field', () => {
    const formFields = [
      { type: 'EMAIL', label: 'Email' },
      { type: 'USERNAME', label: 'Name' }
    ];

    expect(
      issuesOf({
        audience: { formFields },
        entries: [
          entry({
            formValues: [
              { field: 1, value: 'a' },
              { field: 0, value: 'b' },
              { field: 1, value: 'c' }
            ]
          })
        ]
      })
    ).toEqual([
      'entries.0.formValues.2: Each form field has at most one value for each entry'
    ]);
  });

  it(`rejects a form value longer than ${E2E_MAX_FORM_VALUE_LENGTH} characters`, () => {
    const value = 'x'.repeat(E2E_MAX_FORM_VALUE_LENGTH);
    const request = (v: string) => ({
      audience: { formFields: [{ type: 'EMAIL', label: 'Email' }] },
      entries: [entry({ formValues: [{ field: 0, value: v }] })]
    });

    expect(parse(request(value)).success).toBe(true);
    expect(pathsOf(request(`${value}x`))).toEqual([
      'entries.0.formValues.0.value'
    ]);
  });

  it('rejects a prize that does not exist', () => {
    expect(
      issuesOf({
        criteria: { allowUserSelection: true },
        entries: [entry({ prize: 1 })]
      })
    ).toEqual(['entries.0.prize: There is no prize at index 1']);
  });

  it('rejects a prize allocation unless the winners choose their prize', () => {
    const message =
      'entries.0.prize: A prize allocation needs criteria.allowUserSelection';

    expect(issuesOf({ entries: [entry({ prize: 0 })] })).toEqual([message]);
    expect(
      issuesOf({
        criteria: { allowUserSelection: false },
        entries: [entry({ prize: 0 })]
      })
    ).toEqual([message]);
  });

  it('rejects a score outside 0 to 100', () => {
    expect(pathsOf({ entries: [entry({ quality: -1 })] })).toEqual([
      'entries.0.quality'
    ]);
    expect(pathsOf({ entries: [entry({ quality: 101 })] })).toEqual([
      'entries.0.quality'
    ]);
  });

  it(`rejects a reason longer than ${E2E_MAX_REASON_LENGTH} characters`, () => {
    const reason = 'x'.repeat(E2E_MAX_REASON_LENGTH + 1);

    expect(
      pathsOf({ entries: [entry({ completions: [{ task: 0, reason }] })] })
    ).toEqual(['entries.0.completions.0.reason']);
  });

  it(`accepts ${E2E_MAX_TASKS} completions and no more`, () => {
    const tasks = many(E2E_MAX_TASKS, () => ({ type: 'BONUS_TASK' }));
    const completions = many(E2E_MAX_TASKS, (task) => ({ task }));

    expect(parse({ tasks, entries: [entry({ completions })] }).success).toBe(
      true
    );
    expect(
      pathsOf({
        tasks,
        entries: [entry({ completions: [...completions, { task: 0 }] })]
      })
    ).toContain('entries.0.completions');
  });

  it(`accepts ${E2E_MAX_ENTRIES} entries and no more`, () => {
    const entries = many(E2E_MAX_ENTRIES, (index) =>
      entry({ ns: `abc123${index.toString().padStart(2, '0')}` })
    );

    expect(parse({ entries }).success).toBe(true);
    expect(
      pathsOf({ entries: [...entries, entry({ ns: 'abc123zz' })] })
    ).toEqual(['entries']);
  });

  it('rejects an unknown field of an entry', () => {
    expect(pathsOf({ entries: [entry({ email: 'a@b.c' })] })).toEqual([
      'entries.0'
    ]);
  });
});

describe('e2eSweepstakesRequestSchema draws', () => {
  const entries = [
    entry(),
    entry({ persona: 'participant2', completions: [{ task: 0 }, { task: 1 }] })
  ];
  const request = (draws: unknown[]) => ({
    tasks: TWO_TASKS,
    prizes: TWO_PRIZES,
    entries,
    draws
  });

  it('fills in the defaults of a draw', () => {
    expect(parse(request([{ entry: 0, prize: 0 }])).data?.draws).toEqual([
      { entry: 0, prize: 0, result: 'WINNER' }
    ]);
  });

  it('accepts a chain of re-rolls', () => {
    const draws = [
      { entry: 0, prize: 1, result: 'DISQUALIFIED', reason: 'Bot' },
      { entry: 1, prize: 1, task: 1, result: 'DISQUALIFIED', previous: 0 },
      { entry: 0, prize: 1, result: 'WINNER', previous: 1 }
    ];

    expect(parse(request(draws)).data?.draws).toEqual(draws);
  });

  it('rejects a draw of an entry, a prize or a completion that does not exist', () => {
    expect(issuesOf(request([{ entry: 2, prize: 2 }]))).toEqual([
      'draws.0.prize: There is no prize at index 2',
      'draws.0.entry: There is no entry at index 2'
    ]);
    expect(issuesOf(request([{ entry: 0, prize: 0, task: 1 }]))).toEqual([
      'draws.0.task: A draw needs a completion of its entry'
    ]);
  });

  it('rejects a draw of an entry with no completion', () => {
    expect(
      issuesOf({
        entries: [entry({ completions: [] })],
        draws: [{ entry: 0, prize: 0 }]
      })
    ).toEqual(['draws.0.task: A draw needs a completion of its entry']);
  });

  it('rejects a previous draw that comes later or is the draw itself', () => {
    const message = 'The previous draw must come first';

    expect(
      issuesOf(
        request([
          { entry: 0, prize: 0, result: 'DISQUALIFIED', previous: 1 },
          { entry: 1, prize: 0, result: 'DISQUALIFIED' }
        ])
      )
    ).toEqual([`draws.0.previous: ${message}`]);
    expect(issuesOf(request([{ entry: 0, prize: 0, previous: 0 }]))).toEqual([
      `draws.0.previous: ${message}`
    ]);
  });

  it('rejects a re-roll of a draw that is not DISQUALIFIED', () => {
    expect(
      issuesOf(
        request([
          { entry: 0, prize: 0 },
          { entry: 1, prize: 0, previous: 0 }
        ])
      )
    ).toEqual([
      'draws.1.previous: The previous draw of a re-roll must be DISQUALIFIED'
    ]);
  });

  it('rejects a re-roll of another prize', () => {
    expect(
      issuesOf(
        request([
          { entry: 0, prize: 0, result: 'DISQUALIFIED' },
          { entry: 1, prize: 1, previous: 0 }
        ])
      )
    ).toEqual([
      'draws.1.prize: A re-roll draws the prize of its previous draw'
    ]);
  });

  it('rejects two re-rolls of one draw', () => {
    expect(
      issuesOf(
        request([
          { entry: 0, prize: 0, result: 'DISQUALIFIED' },
          { entry: 1, prize: 0, previous: 0 },
          { entry: 1, prize: 0, task: 1, previous: 0 }
        ])
      )
    ).toEqual(['draws: Each draw is the previous draw of at most one draw']);
  });

  it(`accepts ${E2E_MAX_DRAWS} draws and no more`, () => {
    const draws = many(E2E_MAX_DRAWS, () => ({ entry: 0, prize: 0 }));

    expect(parse(request(draws)).success).toBe(true);
    expect(pathsOf(request([...draws, draws[0]]))).toEqual(['draws']);
  });
});

describe('e2eSweepstakesRequestSchema referrals', () => {
  const entries = many(3, (index) => entry({ ns: `abc123p${index}` }));
  const request = (referrals: unknown[]) => ({
    tasks: TWO_TASKS,
    entries,
    referrals
  });

  it('accepts a referral of a REFERRAL_LINK task with the entries it referred', () => {
    const referrals = [{ entry: 0, task: 1, referred: [1, 2] }];

    expect(parse(request(referrals)).data?.referrals).toEqual(referrals);
  });

  it('gives a referral no referred entries by default', () => {
    expect(parse(request([{ entry: 0, task: 1 }])).data?.referrals).toEqual([
      { entry: 0, task: 1, referred: [] }
    ]);
  });

  it('rejects a referral of an entry or a task that does not exist', () => {
    expect(issuesOf(request([{ entry: 3, task: 2, referred: [4] }]))).toEqual([
      'referrals.0.entry: There is no entry at index 3',
      'referrals.0.task: There is no task at index 2',
      'referrals.0.referred.0: There is no entry at index 4'
    ]);
  });

  it('rejects a referral of a task that is not a REFERRAL_LINK', () => {
    expect(issuesOf(request([{ entry: 0, task: 0 }]))).toEqual([
      'referrals.0.task: A referral needs a REFERRAL_LINK task'
    ]);
  });

  it('rejects an entry that refers itself or another entry twice', () => {
    expect(
      issuesOf(request([{ entry: 0, task: 1, referred: [1, 0, 1] }]))
    ).toEqual([
      'referrals.0.referred.1: An entry cannot refer itself',
      'referrals.0.referred.2: Each entry is referred at most once by a referral'
    ]);
  });

  it('rejects two referrals of one entry for one task', () => {
    expect(
      issuesOf(
        request([
          { entry: 0, task: 1 },
          { entry: 1, task: 1 },
          { entry: 0, task: 1 }
        ])
      )
    ).toEqual([
      'referrals.2: Each entry has at most one referral for each task'
    ]);
  });

  it(`accepts ${E2E_MAX_REFERRALS} referrals and no more`, () => {
    const tasks = many(E2E_MAX_TASKS, () => ({ type: 'REFERRAL_LINK' }));
    const entries50 = many(E2E_MAX_ENTRIES, (index) =>
      entry({ ns: `abc123${index.toString().padStart(2, '0')}` })
    );
    const unique = many(E2E_MAX_REFERRALS, (index) => ({
      entry: index,
      task: 0
    }));

    expect(
      parse({ tasks, entries: entries50, referrals: unique }).success
    ).toBe(true);
    expect(
      pathsOf({
        tasks,
        entries: entries50,
        referrals: [...unique, { entry: 0, task: 1 }]
      })
    ).toEqual(['referrals']);
  });
});
