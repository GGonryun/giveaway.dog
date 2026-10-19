import { describe, expect, it, vi } from 'vitest';
import * as runner from '@stryker-mutator/vitest-runner';
import { commonTokens } from '@stryker-mutator/api/plugin';
import {
  MutantRunStatus,
  type MutantRunOptions,
  type MutantRunResult
} from '@stryker-mutator/api/test-runner';
import {
  fileLoadErrors,
  strykerPlugins,
  strykerValidationSchema,
  withFileLoadErrorsAsKilled,
  type VitestRunner
} from '../vitest-runner.ts';

type TestFile = {
  filepath?: string;
  name?: string;
  result?: { errors?: { message?: string }[] };
};

const fakeRunner = (
  result: MutantRunResult,
  files: TestFile[] = []
): VitestRunner =>
  ({
    init: vi.fn(),
    dryRun: vi.fn(),
    mutantRun: vi.fn(async () => result),
    ctx: { state: { getFiles: () => files } }
  }) as unknown as VitestRunner;

const options = {} as MutantRunOptions;

const SURVIVED: MutantRunResult = {
  status: MutantRunStatus.Survived,
  nrOfTests: 0
};

const LOAD_ERROR: TestFile = {
  filepath: '/repo/src/__tests__/schemas.test.ts',
  result: { errors: [{ message: 'A discriminator value could not be found' }] }
};

describe('vitest-runner', () => {
  it('declares one test runner plugin named vitest', () => {
    expect(strykerPlugins.map((plugin) => [plugin.kind, plugin.name])).toEqual([
      ['TestRunner', 'vitest']
    ]);
  });

  it('injects the injector into its factory', () => {
    expect((strykerPlugins[0].factory as { inject?: unknown }).inject).toEqual([
      commonTokens.injector
    ]);
  });

  it('wraps the runner that the Vitest runner plugin creates', async () => {
    const inner = fakeRunner(SURVIVED, [LOAD_ERROR]);
    const injector = {
      provideValue: () => injector,
      injectClass: () => inner
    };

    const created = (
      strykerPlugins[0].factory as unknown as (
        injector: unknown
      ) => VitestRunner
    )(injector);

    expect(created).toBe(inner);
    expect((await created.mutantRun(options)).status).toBe(
      MutantRunStatus.Killed
    );
  });

  it('re-exports the options schema of the Vitest runner', () => {
    expect(strykerValidationSchema).toBe(runner.strykerValidationSchema);
  });
});

describe('fileLoadErrors', () => {
  it('lists the errors of each test file with its path', () => {
    expect(
      fileLoadErrors(
        fakeRunner(SURVIVED, [
          LOAD_ERROR,
          { name: 'other.test.ts', result: { errors: [{}] } },
          { filepath: '/repo/ok.test.ts', result: {} },
          { filepath: '/repo/skipped.test.ts' }
        ])
      )
    ).toEqual([
      '/repo/src/__tests__/schemas.test.ts: A discriminator value could not be found',
      'other.test.ts: '
    ]);
  });

  it('returns no errors before Vitest starts', () => {
    expect(
      fileLoadErrors({ mutantRun: vi.fn() } as unknown as VitestRunner)
    ).toEqual([]);
  });
});

describe('withFileLoadErrorsAsKilled', () => {
  it('reports a surviving mutant whose test file failed to load as killed', async () => {
    const wrapped = withFileLoadErrorsAsKilled(
      fakeRunner({ status: MutantRunStatus.Survived, nrOfTests: 2 }, [
        LOAD_ERROR
      ])
    );

    expect(await wrapped.mutantRun(options)).toEqual({
      status: MutantRunStatus.Killed,
      killedBy: [],
      failureMessage:
        'A test file failed to load: /repo/src/__tests__/schemas.test.ts: A discriminator value could not be found',
      nrOfTests: 2
    });
  });

  it('keeps a surviving mutant when every test file loaded', async () => {
    const wrapped = withFileLoadErrorsAsKilled(
      fakeRunner(SURVIVED, [{ filepath: '/repo/ok.test.ts', result: {} }])
    );

    expect(await wrapped.mutantRun(options)).toEqual(SURVIVED);
  });

  it.each<MutantRunResult>([
    {
      status: MutantRunStatus.Killed,
      killedBy: ['1'],
      failureMessage: 'expected',
      nrOfTests: 1
    },
    { status: MutantRunStatus.Timeout },
    { status: MutantRunStatus.Error, errorMessage: 'boom' }
  ])('passes a $status result through', async (result) => {
    const wrapped = withFileLoadErrorsAsKilled(
      fakeRunner(result, [LOAD_ERROR])
    );

    expect(await wrapped.mutantRun(options)).toBe(result);
  });

  it('runs the mutant on the wrapped runner with the same options', async () => {
    const inner = fakeRunner(SURVIVED);
    const mutantRun = inner.mutantRun;
    const wrapped = withFileLoadErrorsAsKilled(inner);

    await wrapped.mutantRun(options);

    expect(wrapped).toBe(inner);
    expect(mutantRun).toHaveBeenCalledWith(options);
  });
});
