import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pickerId: string }> }
) {
  try {
    const { pickerId } = await params;

    const picker = await prisma.twitterPicker.findUnique({
      where: { id: pickerId },
      include: {
        users: true,
        draws: true
      }
    });

    if (!picker) {
      const response = new ImageResponse(
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1f2937',
            color: '#fff'
          }}
        >
          <h1 style={{ fontSize: '48px' }}>Draw not found</h1>
        </div>,
        {
          width: 1200,
          height: 630
        }
      );

      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');

      return response;
    }

    const isComplete = picker.status === 'COMPLETE';
    const isScheduledOrProcessing = [
      'SCHEDULED',
      'PROCESSING',
      'CREATED'
    ].includes(picker.status);

    const winners = picker.draws.filter((d) => !d.disqualified);
    const eligibleUsers = picker.users.filter((u) => {
      if (
        picker.minPostCount !== null &&
        (u.tweetCount ?? 0) < picker.minPostCount
      ) {
        return false;
      }
      if (
        picker.minFollowersCount !== null &&
        (u.followersCount ?? 0) < picker.minFollowersCount
      ) {
        return false;
      }
      if (
        picker.minFollowingCount !== null &&
        (u.followingCount ?? 0) < picker.minFollowingCount
      ) {
        return false;
      }
      if (picker.minAccountAgeDays !== null && u.createdAt) {
        const accountAgeDays = Math.floor(
          (Date.now() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (accountAgeDays < picker.minAccountAgeDays) {
          return false;
        }
      }
      if (picker.requireProfileImage && !u.profileImageUrl) {
        return false;
      }
      if (picker.requireBannerImage && !u.bannerImageUrl) {
        return false;
      }
      if (picker.requireLocation && !u.location) {
        return false;
      }
      if (picker.requireBio && !u.description) {
        return false;
      }
      return true;
    });

    if (!isComplete) {
      const response = new ImageResponse(
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            backgroundImage:
              'linear-gradient(to bottom right, #dbeafe, #93c5fd, #60a5fa)'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              padding: '48px'
            }}
          >
            <div style={{ fontSize: '96px' }}>🎲</div>
            <h1
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: '#1e3a8a',
                margin: 0,
                textAlign: 'center'
              }}
            >
              X Picker Draw
            </h1>
            <p
              style={{
                fontSize: '32px',
                color: '#1e40af',
                margin: 0,
                textAlign: 'center'
              }}
            >
              {isScheduledOrProcessing
                ? picker.runAt
                  ? `Scheduled for ${new Date(picker.runAt).toLocaleDateString()}`
                  : 'Processing entries...'
                : 'Draw in progress'}
            </p>
            <div
              style={{
                display: 'flex',
                gap: '32px',
                marginTop: '16px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span
                  style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: '#1e3a8a'
                  }}
                >
                  {picker.winners}
                </span>
                <span
                  style={{
                    fontSize: '20px',
                    color: '#1e40af'
                  }}
                >
                  Winner Slots
                </span>
              </div>
            </div>
          </div>
        </div>,
        {
          width: 1200,
          height: 630
        }
      );

      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');

      return response;
    }

    if (winners.length === 0) {
      const response = new ImageResponse(
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            backgroundImage:
              'linear-gradient(to bottom right, #dbeafe, #93c5fd, #60a5fa)'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              padding: '48px'
            }}
          >
            <div style={{ fontSize: '96px' }}>🎲</div>
            <h1
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: '#1e3a8a',
                margin: 0,
                textAlign: 'center'
              }}
            >
              X Picker Draw
            </h1>
            <p
              style={{
                fontSize: '32px',
                color: '#1e40af',
                margin: 0,
                textAlign: 'center'
              }}
            >
              No winners selected
            </p>
          </div>
        </div>,
        {
          width: 1200,
          height: 630
        }
      );

      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');

      return response;
    }

    const firstWinner = winners[0];
    const winnerUser = picker.users.find(
      (u) => u.userId === firstWinner.userId
    );
    const winnerCount = winners.length;

    const response = new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          backgroundImage:
            'linear-gradient(to bottom right, #fef3c7, #fde68a, #fcd34d)',
          padding: '48px'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '32px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '64px',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <span style={{ fontSize: '72px' }}>🎉</span>
            <h1
              style={{
                fontSize: '56px',
                fontWeight: 'bold',
                background:
                  'linear-gradient(to right, #f59e0b, #d97706, #b45309)',
                backgroundClip: 'text',
                color: 'transparent',
                margin: 0
              }}
            >
              Winner{winnerCount > 1 ? 's' : ''} Selected!
            </h1>
          </div>

          {winnerUser?.profileImageUrl && (
            <img
              src={winnerUser.profileImageUrl}
              alt={winnerUser.name || 'Winner'}
              style={{
                width: '160px',
                height: '160px',
                borderRadius: '80px',
                border: '6px solid #f59e0b'
              }}
            />
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {winnerUser?.name && (
              <h2
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: 0
                }}
              >
                {winnerUser.name}
              </h2>
            )}
            {winnerUser?.username && (
              <p
                style={{
                  fontSize: '32px',
                  color: '#6b7280',
                  margin: 0
                }}
              >
                @{winnerUser.username}
              </p>
            )}
          </div>

          {winnerCount > 1 && (
            <p
              style={{
                fontSize: '28px',
                color: '#92400e',
                margin: 0,
                textAlign: 'center'
              }}
            >
              + {winnerCount - 1} more winner{winnerCount - 1 > 1 ? 's' : ''}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              marginTop: '16px'
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '32px',
                fontSize: '20px',
                color: '#78716c'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                  }}
                >
                  {picker.users.length}
                </span>
                <span>Participants</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                  }}
                >
                  {eligibleUsers.length}
                </span>
                <span>Eligible</span>
              </div>
            </div>
            <p
              style={{
                fontSize: '18px',
                color: '#a8a29e',
                margin: 0,
                marginTop: '8px'
              }}
            >
              Verified on Giveaway.dog
            </p>
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630
      }
    );

    response.headers.set(
      'Cache-Control',
      'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
    );

    return response;
  } catch (error) {
    console.error('[OG Image] Error generating X picker image', error);

    const response = new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1f2937',
          color: '#fff'
        }}
      >
        <h1 style={{ fontSize: '48px' }}>Error loading draw</h1>
      </div>,
      {
        width: 1200,
        height: 630
      }
    );

    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');

    return response;
  }
}
