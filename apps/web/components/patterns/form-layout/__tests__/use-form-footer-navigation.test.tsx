import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFormFooterNavigation } from '../use-form-footer-navigation';
import {
  createLayoutContext,
  LayoutContextValue,
  LayoutProvider
} from './layout-context';

const renderNavigation = (overrides: Partial<LayoutContextValue> = {}) => {
  const context = createLayoutContext({
    setCurrentStep: vi.fn(),
    ...overrides
  });
  const { result } = renderHook(() => useFormFooterNavigation(), {
    wrapper: ({ children }) => (
      <LayoutProvider value={context}>{children}</LayoutProvider>
    )
  });
  return { result, setCurrentStep: context.setCurrentStep };
};

describe('useFormFooterNavigation', () => {
  describe('on the first step', () => {
    it('can only move forward', () => {
      const { result } = renderNavigation({ currentStep: 'details' });
      expect(result.current.hasNextStep).toBe(true);
      expect(result.current.hasPreviousStep).toBe(false);
    });

    it('moves to the second step', () => {
      const { result, setCurrentStep } = renderNavigation({
        currentStep: 'details'
      });
      result.current.handleNext();
      expect(setCurrentStep).toHaveBeenCalledExactlyOnceWith('prizes');
    });

    it('ignores a request to go back', () => {
      const { result, setCurrentStep } = renderNavigation({
        currentStep: 'details'
      });
      result.current.handlePrevious();
      expect(setCurrentStep).not.toHaveBeenCalled();
    });
  });

  describe('on a middle step', () => {
    it('can move in both directions', () => {
      const { result } = renderNavigation({ currentStep: 'prizes' });
      expect(result.current.hasNextStep).toBe(true);
      expect(result.current.hasPreviousStep).toBe(true);
    });

    it('moves forward to the next step', () => {
      const { result, setCurrentStep } = renderNavigation({
        currentStep: 'prizes'
      });
      result.current.handleNext();
      expect(setCurrentStep).toHaveBeenCalledExactlyOnceWith('tasks');
    });

    it('moves back to the previous step', () => {
      const { result, setCurrentStep } = renderNavigation({
        currentStep: 'prizes'
      });
      result.current.handlePrevious();
      expect(setCurrentStep).toHaveBeenCalledExactlyOnceWith('details');
    });
  });

  describe('on the last step', () => {
    it('can only move back', () => {
      const { result } = renderNavigation({ currentStep: 'tasks' });
      expect(result.current.hasNextStep).toBe(false);
      expect(result.current.hasPreviousStep).toBe(true);
    });

    it('ignores a request to go forward', () => {
      const { result, setCurrentStep } = renderNavigation({
        currentStep: 'tasks'
      });
      result.current.handleNext();
      expect(setCurrentStep).not.toHaveBeenCalled();
    });
  });

  describe('when the current step is not in the step order', () => {
    it('can only move forward', () => {
      const { result } = renderNavigation({ currentStep: 'unknown' });
      expect(result.current.hasNextStep).toBe(true);
      expect(result.current.hasPreviousStep).toBe(false);
    });

    it('moves forward to the first step', () => {
      const { result, setCurrentStep } = renderNavigation({
        currentStep: 'unknown'
      });
      result.current.handleNext();
      expect(setCurrentStep).toHaveBeenCalledExactlyOnceWith('details');
    });
  });

  it.each([
    ['there are no steps', [], ''],
    ['there is a single step', ['details'], 'details']
  ])('cannot move anywhere when %s', (_, stepOrder, currentStep) => {
    const { result, setCurrentStep } = renderNavigation({
      stepOrder,
      currentStep
    });
    expect(result.current.hasNextStep).toBe(false);
    expect(result.current.hasPreviousStep).toBe(false);
    result.current.handleNext();
    result.current.handlePrevious();
    expect(setCurrentStep).not.toHaveBeenCalled();
  });
});
