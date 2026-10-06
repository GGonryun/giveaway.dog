import { describe, expect, it } from 'vitest';
import {
  IGNORE_CONSOLE_REASON,
  ignoreConsole,
  isConsoleCall,
  strykerPlugins
} from '../ignore-console.ts';

const consoleCall = (object = 'console') => ({
  type: 'CallExpression',
  callee: {
    type: 'MemberExpression',
    object: { type: 'Identifier', name: object }
  }
});

describe('isConsoleCall', () => {
  it('matches a console method call', () => {
    expect(isConsoleCall(consoleCall())).toBe(true);
  });

  it('matches a statement that is a console method call', () => {
    expect(
      isConsoleCall({ type: 'ExpressionStatement', expression: consoleCall() })
    ).toBe(true);
  });

  it('does not match a method call on another object', () => {
    expect(isConsoleCall(consoleCall('logger'))).toBe(false);
  });

  it('does not match a call of a plain function', () => {
    expect(
      isConsoleCall({
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'console' }
      })
    ).toBe(false);
  });

  it('does not match a property read of console', () => {
    expect(
      isConsoleCall({
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'console' }
      })
    ).toBe(false);
  });

  it('does not match a statement that is not a call', () => {
    expect(
      isConsoleCall({
        type: 'ExpressionStatement',
        expression: { type: 'Identifier', name: 'console' }
      })
    ).toBe(false);
  });

  it('does not match a statement without an expression', () => {
    expect(isConsoleCall({ type: 'ExpressionStatement' })).toBe(false);
  });

  it('does not match a call without a callee', () => {
    expect(isConsoleCall({ type: 'CallExpression' })).toBe(false);
  });

  it('does not match a constructor call on console', () => {
    expect(
      isConsoleCall({
        type: 'NewExpression',
        callee: consoleCall().callee
      })
    ).toBe(false);
  });

  it('does not match a member call on a computed object', () => {
    expect(
      isConsoleCall({
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { type: 'ThisExpression' }
        }
      })
    ).toBe(false);
  });
});

describe('ignoreConsole', () => {
  it('ignores the node of a console call with a reason', () => {
    expect(ignoreConsole.shouldIgnore({ node: consoleCall() })).toBe(
      'Ignored a console call'
    );
    expect(IGNORE_CONSOLE_REASON).toBe('Ignored a console call');
  });

  it('keeps every other node', () => {
    expect(
      ignoreConsole.shouldIgnore({ node: consoleCall('logger') })
    ).toBeUndefined();
  });
});

describe('strykerPlugins', () => {
  it('declares the ignorer under the name console', () => {
    expect(strykerPlugins).toEqual([
      { kind: 'Ignore', name: 'console', value: ignoreConsole }
    ]);
  });
});
