import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TeamLogo } from '../team-logo';

const LOGO_URL = 'https://cdn.example.com/doggo.png';

describe('TeamLogo', () => {
  describe('when the logo url is valid', () => {
    it('matches the snapshot', () => {
      const { container } = render(
        <TeamLogo logoUrl={LOGO_URL} alt="Doggo Club logo" size={48} />
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('when the logo url cannot be used', () => {
    it('matches the snapshot', () => {
      const { container } = render(<TeamLogo logoUrl={null} size={50} />);

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
