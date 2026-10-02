import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TeamLogo } from '../team-logo';

const LOGO_URL = 'https://cdn.example.com/doggo.png';

describe('TeamLogo', () => {
  describe('when the logo url is valid', () => {
    it('renders the logo image with the given alt text', () => {
      render(<TeamLogo logoUrl={LOGO_URL} alt="Doggo Club logo" />);

      expect(
        screen.getByRole('img', { name: 'Doggo Club logo' })
      ).toBeInTheDocument();
    });

    it('defaults to a 40px image described as the team logo', () => {
      render(<TeamLogo logoUrl={LOGO_URL} />);

      const image = screen.getByRole('img', { name: 'Team logo' });
      expect(image).toHaveAttribute('width', '40');
      expect(image).toHaveAttribute('height', '40');
    });

    it('accepts plain http urls', () => {
      render(<TeamLogo logoUrl="http://cdn.example.com/doggo.png" />);

      expect(
        screen.getByRole('img', { name: 'Team logo' })
      ).toBeInTheDocument();
    });

    it('adds a custom class name to the image', () => {
      render(<TeamLogo logoUrl={LOGO_URL} className="border" />);

      expect(screen.getByRole('img', { name: 'Team logo' })).toHaveClass(
        'object-cover',
        'rounded-md',
        'border'
      );
    });
  });

  describe('when the logo url cannot be used', () => {
    it.each([
      ['missing', undefined],
      ['null', null],
      ['empty', ''],
      ['not a url', 'doggo.png'],
      ['relative', '/images/doggo.png'],
      ['non-http', 'ftp://cdn.example.com/doggo.png']
    ])('renders the fallback icon when the url is %s', (_label, logoUrl) => {
      render(<TeamLogo logoUrl={logoUrl} />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('sizes the fallback box to the requested size', () => {
      const { container } = render(<TeamLogo logoUrl={null} size={64} />);

      expect(container.firstChild).toHaveStyle({
        width: '64px',
        height: '64px'
      });
    });
  });

  describe('when the image fails to load', () => {
    it('switches to the fallback icon', () => {
      render(<TeamLogo logoUrl={LOGO_URL} alt="Doggo Club logo" />);

      fireEvent.error(screen.getByRole('img', { name: 'Doggo Club logo' }));

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });
});
