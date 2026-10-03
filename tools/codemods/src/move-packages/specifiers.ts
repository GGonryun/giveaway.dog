import path from 'node:path';
import { Node, Project, ScriptKind, SyntaxKind } from 'ts-morph';
import type { SourceFile } from 'ts-morph';

export type Specifier = {
  start: number;
  end: number;
  value: string;
  mockOnly: boolean;
};

export type Directive = {
  value: string;
  end: number;
};

export type ParsedModule = {
  specifiers: Specifier[];
  directives: Directive[];
};

const VI_MOCKS = new Set(['mock', 'doMock', 'unmock', 'doUnmock']);

const VI_IMPORTS = new Set(['importActual', 'importMock']);

const SCRIPT_KINDS: Record<string, ScriptKind> = {
  '.ts': ScriptKind.TS,
  '.mts': ScriptKind.TS,
  '.tsx': ScriptKind.TSX,
  '.js': ScriptKind.JS,
  '.mjs': ScriptKind.JS,
  '.jsx': ScriptKind.JSX
};

const project = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: { allowJs: true }
});

const literal = (
  node: Node | undefined,
  mockOnly: boolean
): Specifier | null => {
  if (
    !node ||
    !(Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node))
  ) {
    return null;
  }
  return {
    start: node.getStart() + 1,
    end: node.getEnd() - 1,
    value: node.getLiteralText(),
    mockOnly
  };
};

const moduleCall = (node: Node): 'import' | 'mock' | null => {
  if (!Node.isCallExpression(node)) return null;
  const callee = node.getExpression();
  if (callee.getKind() === SyntaxKind.ImportKeyword) return 'import';
  if (Node.isIdentifier(callee)) {
    return callee.getText() === 'require' ? 'import' : null;
  }
  if (!Node.isPropertyAccessExpression(callee)) return null;
  const target = callee.getExpression().getText();
  if (target !== 'vi' && target !== 'vitest') return null;
  if (VI_MOCKS.has(callee.getName())) return 'mock';
  return VI_IMPORTS.has(callee.getName()) ? 'import' : null;
};

const collect = (file: SourceFile): Specifier[] => {
  const found: Specifier[] = [];
  const add = (node: Node | undefined, mockOnly = false) => {
    const specifier = literal(node, mockOnly);
    if (specifier) found.push(specifier);
  };
  file.forEachDescendant((node) => {
    if (Node.isImportDeclaration(node) || Node.isExportDeclaration(node)) {
      add(node.getModuleSpecifier());
    } else if (Node.isExternalModuleReference(node)) {
      add(node.getExpression());
    } else if (Node.isImportTypeNode(node)) {
      const argument = node.getArgument();
      if (Node.isLiteralTypeNode(argument)) add(argument.getLiteral());
    } else if (Node.isCallExpression(node)) {
      const call = moduleCall(node);
      if (call) add(node.getArguments()[0], call === 'mock');
    }
  });
  return found.sort((a, b) => a.start - b.start);
};

const directivesOf = (file: SourceFile): Directive[] => {
  const directives: Directive[] = [];
  for (const statement of file.getStatements()) {
    if (!Node.isExpressionStatement(statement)) break;
    const expression = statement.getExpression();
    if (!Node.isStringLiteral(expression)) break;
    directives.push({
      value: expression.getLiteralText(),
      end: statement.getEnd()
    });
  }
  return directives;
};

export const parseModule = (file: string, text: string): ParsedModule => {
  const ext = path.posix.extname(file);
  const source = project.createSourceFile(`/${file}`, text, {
    overwrite: true,
    scriptKind: SCRIPT_KINDS[ext] ?? ScriptKind.TS
  });
  try {
    return { specifiers: collect(source), directives: directivesOf(source) };
  } finally {
    project.removeSourceFile(source);
  }
};

export type Edit = { start: number; end: number; text: string };

export const applyEdits = (text: string, edits: Edit[]) =>
  [...edits]
    .sort((a, b) => b.start - a.start)
    .reduce(
      (result, edit) =>
        result.slice(0, edit.start) + edit.text + result.slice(edit.end),
      text
    );
