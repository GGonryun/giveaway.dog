'use client';

import React from 'react';
import { PickerDrawVerification } from './picker-draw-verification';
import { PublicPickerSchema } from '../schemas/public-picker';
import { PickerDrawResult, PickerStatus, PickerType } from '@prisma/client';
import { TWITTER_POST_URL } from '@/lib/settings';

const MOCK_PICKER_DATA: PublicPickerSchema = {
  id: 'mock-picker-id',
  teamId: 'mock-team-id',
  status: PickerStatus.COMPLETE,
  type: PickerType.TWITTER,
  createdAt: new Date('2024-06-15T10:00:00Z'),
  updatedAt: new Date('2024-06-20T15:30:00Z'),
  form: {
    setup: {
      postUrl: TWITTER_POST_URL,
      name: 'Summer Giveaway - iPad Pro Winner Draw',
      integrationId: 'demo-integration'
    },
    timing: null,
    winners: {
      quota: 3
    },
    actions: {
      like: true,
      repost: true,
      quote: true,
      reply: false
    },
    filters: {
      minimumPostCount: 10,
      minimumAccountAgeDays: 30,
      minimumFollowers: 100,
      minimumFollowing: null
    },
    requirements: {
      hasProfileImage: true,
      hasBanner: false,
      hasLocation: false,
      hasDescription: true
    }
  },
  draws: {
    draws: [
      {
        drawId: 'draw-1',
        drawnAt: new Date('2024-06-20T15:30:00Z'),
        drawNumber: 1,
        eligibleEntries: 2147,
        winner: {
          userId: 'user-1',
          position: 1,
          username: 'sarah_creates',
          name: 'Sarah Johnson',
          profile_image_url: null
        },
        result: PickerDrawResult.DISQUALIFIED,
        disqualificationReason: 'Did not meet minimum follower requirement',
        previousDrawId: null
      },
      {
        drawId: 'draw-2',
        drawnAt: new Date('2024-06-20T15:31:00Z'),
        drawNumber: 2,
        eligibleEntries: 1246,
        winner: {
          userId: 'user-2',
          position: 2,
          username: 'tech_mike',
          name: 'Mike Chen',
          profile_image_url: null
        },
        result: PickerDrawResult.WINNER,
        disqualificationReason: null,
        previousDrawId: 'draw-1'
      },
      {
        drawId: 'draw-3',
        drawnAt: new Date('2024-06-20T15:32:00Z'),
        drawNumber: 3,
        eligibleEntries: 1245,
        winner: {
          userId: 'user-3',
          position: 3,
          username: 'design_pro',
          name: 'Alex Rivera',
          profile_image_url: null
        },
        result: PickerDrawResult.WINNER,
        disqualificationReason: null,
        previousDrawId: 'draw-2'
      }
    ],
    outcome: {
      totalDraws: 3,
      finalDraws: ['draw-1', 'draw-2', 'draw-3']
    }
  },
  jobs: [],
  logs: [],
  users: [],
  stats: {
    totalEntries: 3842,
    uniqueParticipants: 2147,
    filteredEntries: 0,
    validEntries: 2147
  }
};

export const PickerDrawPreview: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <PickerDrawVerification picker={MOCK_PICKER_DATA} />
    </div>
  );
};
