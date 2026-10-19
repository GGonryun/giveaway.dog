import {
  commonTokens,
  declareFactoryPlugin,
  PluginKind,
  tokens,
  type Injector
} from '@stryker-mutator/api/plugin';
import {
  MutantRunStatus,
  type MutantRunOptions,
  type MutantRunResult,
  type TestRunner
} from '@stryker-mutator/api/test-runner';
import {
  strykerPlugins as vitestPlugins,
  strykerValidationSchema
} from '@stryker-mutator/vitest-runner';

export { strykerValidationSchema };

type TestFile = {
  filepath?: string;
  name?: string;
  result?: { errors?: { message?: string }[] };
};

export type VitestRunner = TestRunner & {
  ctx?: { state: { getFiles: () => TestFile[] } };
};

export const fileLoadErrors = (runner: VitestRunner): string[] =>
  (runner.ctx?.state.getFiles() ?? []).flatMap((file) =>
    (file.result?.errors ?? []).map(
      (error) => `${file.filepath ?? file.name}: ${error.message ?? ''}`
    )
  );

export const withFileLoadErrorsAsKilled = (
  runner: VitestRunner
): VitestRunner => {
  const mutantRun = runner.mutantRun.bind(runner);
  runner.mutantRun = async (
    options: MutantRunOptions
  ): Promise<MutantRunResult> => {
    const result = await mutantRun(options);
    if (result.status !== MutantRunStatus.Survived) return result;
    const errors = fileLoadErrors(runner);
    if (errors.length === 0) return result;
    return {
      status: MutantRunStatus.Killed,
      killedBy: [],
      failureMessage: `A test file failed to load: ${errors[0]}`,
      nrOfTests: result.nrOfTests
    };
  };
  return runner;
};

const [vitestPlugin] = vitestPlugins;

const createRunner = (injector: Injector): VitestRunner =>
  withFileLoadErrorsAsKilled(
    vitestPlugin.factory(injector as never) as VitestRunner
  );
createRunner.inject = tokens(commonTokens.injector);

export const strykerPlugins = [
  declareFactoryPlugin(PluginKind.TestRunner, 'vitest', createRunner)
];
