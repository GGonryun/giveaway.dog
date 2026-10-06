import { declareValuePlugin, PluginKind } from '@stryker-mutator/api/plugin';
import type { NodePath } from '@stryker-mutator/api/ignore';

type AstNode = {
  type: string;
  name?: string;
  object?: AstNode;
  callee?: AstNode;
  expression?: AstNode;
};

type ConsolePath = NodePath & { node: AstNode };

export const IGNORE_CONSOLE_REASON = 'Ignored a console call';

export const isConsoleCall = (node: AstNode): boolean => {
  const call = node.type === 'ExpressionStatement' ? node.expression : node;
  return (
    call?.type === 'CallExpression' && call.callee?.object?.name === 'console'
  );
};

export const ignoreConsole = {
  shouldIgnore: (path: NodePath): string | undefined =>
    isConsoleCall((path as ConsolePath).node)
      ? IGNORE_CONSOLE_REASON
      : undefined
};

export const strykerPlugins = [
  declareValuePlugin(PluginKind.Ignore, 'console', ignoreConsole)
];
