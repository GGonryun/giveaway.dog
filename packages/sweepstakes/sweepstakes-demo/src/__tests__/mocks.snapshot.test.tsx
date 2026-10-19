import { describe, expect, it } from 'vitest';
import {
  mockHost,
  mockParticipant,
  mockParticipation,
  mockUserHostRelationship,
  mockUserParticipation,
  mockUserProfile,
  mockUserReferral,
  mockWinners
} from '../mocks';

describe('mock data', () => {
  it.each([
    ['mockHost', mockHost],
    ['mockUserProfile', mockUserProfile],
    ['mockParticipation', mockParticipation],
    ['mockUserParticipation', mockUserParticipation],
    ['mockParticipant', mockParticipant],
    ['mockUserHostRelationship', mockUserHostRelationship],
    ['mockWinners', mockWinners]
  ])('%s matches the snapshot', (_, value) => {
    expect(value).toMatchSnapshot();
  });

  it('mockUserReferral matches the snapshot', () => {
    expect({ ...mockUserReferral, link: undefined }).toMatchSnapshot();
  });
});
