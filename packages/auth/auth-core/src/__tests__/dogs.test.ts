import { describe, it, expect } from 'vitest';
import { DOG_BREEDS } from '../dogs';

describe('DOG_BREEDS', () => {
  it('contains 510 breeds', () => {
    expect(DOG_BREEDS).toHaveLength(510);
  });

  it('has no duplicate breeds', () => {
    expect(new Set(DOG_BREEDS).size).toBe(DOG_BREEDS.length);
  });

  it('has no empty or padded names', () => {
    for (const breed of DOG_BREEDS) {
      expect(breed.length).toBeGreaterThan(0);
      expect(breed).toBe(breed.trim());
    }
  });

  it('starts with Affenpinscher and ends with Šarplaninac', () => {
    expect(DOG_BREEDS[0]).toBe('Affenpinscher');
    expect(DOG_BREEDS[DOG_BREEDS.length - 1]).toBe('Šarplaninac');
  });

  it('includes well known breeds', () => {
    expect(DOG_BREEDS).toEqual(
      expect.arrayContaining([
        'Beagle',
        'Basset Hound',
        'St. Bernard',
        'Yorkshire Terrier',
        'Welsh Corgi, Pembroke'
      ])
    );
  });

  it('keeps a stray citation marker in one breed name', () => {
    expect(DOG_BREEDS).toContain('Australian Stumpy Tail Cattle Dog[10]');
    expect(DOG_BREEDS.filter((breed) => breed.includes('['))).toEqual([
      'Australian Stumpy Tail Cattle Dog[10]'
    ]);
  });
});
