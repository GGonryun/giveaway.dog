import AxeBuilder from '@axe-core/playwright';
import { test as base, type Page, type TestInfo } from '@playwright/test';
import {
  KNOWN_VIOLATIONS,
  type KnownViolation
} from '../a11y/known-violations';
import { issueUrl } from '../helpers/known-bug';

export const A11Y_TAGS = ['wcag2a', 'wcag2aa'];

export const FAILING_IMPACTS = ['serious', 'critical'];

export const KNOWN_VIOLATION_ANNOTATION = 'known-a11y-violation';

const FRAME_SEPARATOR = ' >>> ';

export type A11yOptions = {
  name: string;
  exclude?: string[];
};

type A11yNode = {
  rule: string;
  impact: string;
  target: string;
  html: string;
  help: string;
};

type NodeFacts = {
  known: KnownViolation | undefined;
  context: string;
};

const readNode = async (
  page: Page,
  node: A11yNode,
  candidates: KnownViolation[]
): Promise<NodeFacts> => {
  if (node.target.includes(FRAME_SEPARATOR)) {
    return { known: undefined, context: 'inside a frame or a shadow root' };
  }
  const element = page.locator(node.target).first();
  if ((await element.count()) === 0) return { known: undefined, context: '' };

  const [matched, context] = await element.evaluate(
    (target, selectors) => {
      const matched = selectors.findIndex(
        (selector) => target.closest(selector) !== null
      );
      const slots: string[] = [];
      for (
        let ancestor: typeof target | null = target;
        ancestor && slots.length < 6;
        ancestor = ancestor.parentElement
      ) {
        const slot = ancestor.getAttribute('data-slot');
        if (slot) slots.push(`${ancestor.tagName.toLowerCase()}[${slot}]`);
      }
      const text = (target.textContent ?? '').replace(/\s+/g, ' ').trim();
      return [
        matched,
        `inside ${slots.join(' < ') || 'no data-slot'}, text "${text.slice(0, 60)}"`
      ] as const;
    },
    candidates.map((entry) => entry.selector)
  );

  return { known: candidates[matched], context };
};

const describeNode = (node: A11yNode, context: string) =>
  `${node.rule} (${node.impact}) at ${node.target}\n  ${context}\n  ${node.html}\n  ${node.help}`;

export const scanPage = async (
  page: Page,
  testInfo: TestInfo,
  { name, exclude = [] }: A11yOptions
) => {
  const builder = new AxeBuilder({ page }).withTags(A11Y_TAGS);
  for (const selector of exclude) builder.exclude(selector);
  const results = await builder.analyze();

  await testInfo.attach(`axe ${name}`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json'
  });

  const nodes: A11yNode[] = results.violations
    .filter((violation) => FAILING_IMPACTS.includes(violation.impact ?? ''))
    .flatMap((violation) =>
      violation.nodes.map((node) => ({
        rule: violation.id,
        impact: violation.impact ?? '',
        target: node.target.map(String).join(FRAME_SEPARATOR),
        html: node.html,
        help: violation.helpUrl
      }))
    );

  const fresh: string[] = [];
  for (const node of nodes) {
    const { known, context } = await readNode(
      page,
      node,
      KNOWN_VIOLATIONS.filter((entry) => entry.rule === node.rule)
    );
    if (!known) {
      fresh.push(describeNode(node, context));
      continue;
    }
    testInfo.annotations.push({
      type: KNOWN_VIOLATION_ANNOTATION,
      description: `${issueUrl(known.issue)} ${name}: ${node.rule} at ${known.selector}`
    });
  }

  if (fresh.length > 0) {
    throw new Error(
      `${name} has ${fresh.length} new serious or critical accessibility violation(s). Fix them, or file an issue and add them to src/a11y/known-violations.ts:\n\n${fresh.join('\n\n')}`
    );
  }
};

export const test = base.extend<{
  checkA11y: (page: Page, options: A11yOptions) => Promise<void>;
}>({
  checkA11y: async ({}, provide, testInfo) => {
    await provide((page, options) =>
      base.step(`axe: ${options.name}`, () => scanPage(page, testInfo, options))
    );
  }
});
