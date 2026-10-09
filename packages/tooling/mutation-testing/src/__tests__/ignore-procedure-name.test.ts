import { describe, expect, it } from 'vitest';
import {
  IGNORE_PROCEDURE_NAME_REASON,
  ignoreProcedureName,
  isProcedureNameCall,
  strykerPlugins
} from '../ignore-procedure-name.ts';

const call = (callee: { type: string; name?: string }) => ({
  type: 'CallExpression',
  callee
});

describe('isProcedureNameCall', () => {
  it('matches a call of procedure', () => {
    expect(
      isProcedureNameCall(call({ type: 'Identifier', name: 'procedure' }))
    ).toBe(true);
  });

  it('does not match a call of another function', () => {
    expect(
      isProcedureNameCall(call({ type: 'Identifier', name: 'handler' }))
    ).toBe(false);
  });

  it('does not match a method named procedure', () => {
    expect(
      isProcedureNameCall(call({ type: 'MemberExpression', name: 'procedure' }))
    ).toBe(false);
  });

  it('does not match a node that is not a call', () => {
    expect(
      isProcedureNameCall({
        type: 'NewExpression',
        callee: { type: 'Identifier', name: 'procedure' }
      })
    ).toBe(false);
  });

  it('does not match a call without a callee', () => {
    expect(isProcedureNameCall({ type: 'CallExpression' })).toBe(false);
  });
});

describe('ignoreProcedureName', () => {
  it('ignores the call of procedure with a reason', () => {
    expect(
      ignoreProcedureName.shouldIgnore({
        node: call({ type: 'Identifier', name: 'procedure' })
      })
    ).toBe('Ignored the name of a procedure');
    expect(IGNORE_PROCEDURE_NAME_REASON).toBe(
      'Ignored the name of a procedure'
    );
  });

  it('keeps every other node', () => {
    expect(
      ignoreProcedureName.shouldIgnore({
        node: call({ type: 'Identifier', name: 'handler' })
      })
    ).toBeUndefined();
  });
});

describe('strykerPlugins', () => {
  it('declares the ignorer under the name procedure-name', () => {
    expect(strykerPlugins).toEqual([
      {
        kind: 'Ignore',
        name: 'procedure-name',
        value: ignoreProcedureName
      }
    ]);
  });
});
