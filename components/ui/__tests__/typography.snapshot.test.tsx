import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Typography } from '../typography';

describe('Typography', () => {
  it('matches the snapshot with the default variants', () => {
    const { container } = render(<Typography>Body text</Typography>);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('Typography.Paragraph', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <Typography.Paragraph>Paragraph</Typography.Paragraph>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('Typography.Code', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <Typography.Code>pnpm install</Typography.Code>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('Typography.Caption', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <Typography.Caption>Caption</Typography.Caption>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('Typography.Header', () => {
  it('matches the snapshot for a level 2 heading', () => {
    const { container } = render(
      <Typography.Header level={2}>Section</Typography.Header>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
