import ts from 'typescript';

const EMPTY_MODULE_MARKER = /^export\s*\{\s*\};?$/gm;
const USE_STRICT_DIRECTIVE = /^"use strict";$/gm;

export const hasRuntimeCode = (source: string): boolean =>
  ts
    .transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ESNext,
        removeComments: true
      }
    })
    .outputText.replace(EMPTY_MODULE_MARKER, '')
    .replace(USE_STRICT_DIRECTIVE, '')
    .trim() !== '';
