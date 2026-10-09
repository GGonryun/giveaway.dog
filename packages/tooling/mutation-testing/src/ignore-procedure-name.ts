import { declareValuePlugin, PluginKind } from '@stryker-mutator/api/plugin';
import type { NodePath } from '@stryker-mutator/api/ignore';

type AstNode = {
  type: string;
  name?: string;
  callee?: AstNode;
};

type ProcedurePath = NodePath & { node: AstNode };

export const IGNORE_PROCEDURE_NAME_REASON = 'Ignored the name of a procedure';

export const isProcedureNameCall = (node: AstNode): boolean =>
  node.type === 'CallExpression' &&
  node.callee?.type === 'Identifier' &&
  node.callee.name === 'procedure';

export const ignoreProcedureName = {
  shouldIgnore: (path: NodePath): string | undefined =>
    isProcedureNameCall((path as ProcedurePath).node)
      ? IGNORE_PROCEDURE_NAME_REASON
      : undefined
};

export const strykerPlugins = [
  declareValuePlugin(PluginKind.Ignore, 'procedure-name', ignoreProcedureName)
];
