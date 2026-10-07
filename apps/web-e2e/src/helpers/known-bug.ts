import type { TestDetails } from '@playwright/test';
import { TAGS } from './tags';

export const ISSUES_URL = 'https://github.com/GGonryun/giveaway.dog/issues';

export const issueUrl = (issue: number) => `${ISSUES_URL}/${issue}`;

const toArray = <T>(value: T | T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];

const withIssue = (
  tag: string,
  issue: number,
  details: TestDetails
): TestDetails => {
  if (!Number.isInteger(issue) || issue < 1) {
    throw new Error(`${tag} needs the number of its issue, not ${issue}`);
  }

  return {
    ...details,
    tag: [tag, ...toArray(details.tag)],
    annotation: [
      { type: 'issue', description: issueUrl(issue) },
      ...toArray(details.annotation)
    ]
  };
};

export const knownBug = (issue: number, details: TestDetails = {}) =>
  withIssue(TAGS.knownBug, issue, details);

export const quarantine = (issue: number, details: TestDetails = {}) =>
  withIssue(TAGS.quarantine, issue, details);
