import { describe, expect, it } from 'vitest';
import { text } from '../text';

describe('text', () => {
  it('matches the snapshot of the text tokens', () => {
    expect(text).toMatchSnapshot();
  });
});
