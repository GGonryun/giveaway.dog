import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {
  PUBLIC_PICKER_INCLUDE,
  toPublicPicker
} from '@/lib/pickers/schemas/public-picker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pickerId: string }> }
) {
  try {
    const { pickerId } = await params;

    const picker = await prisma.picker.findUnique({
      where: { id: pickerId },
      include: PUBLIC_PICKER_INCLUDE
    });

    if (!picker) {
      return new ImageResponse(
        (
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
            <h1 style={{ fontSize: '48px' }}>Picker not found</h1>
          </div>
        ),
        {
          width: 1200,
          height: 630
        }
      );
    }

    let publicPicker;
    try {
      publicPicker = toPublicPicker(picker);
    } catch (error) {
      console.error('[OG Image] Error parsing picker data', error);
      return new ImageResponse(
        (
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
            <div style={{ fontSize: '96px' }}>🎲</div>
            <h1
              style={{
                fontSize: '48px',
                color: '#1e3a8a',
                textAlign: 'center',
                margin: '24px',
                padding: '0 48px'
              }}
            >
              Giveaway Draw
            </h1>
            <p
              style={{
                fontSize: '24px',
                color: '#1e40af',
                textAlign: 'center'
              }}
            >
              Processing entries...
            </p>
          </div>
        ),
        {
          width: 1200,
          height: 630
        }
      );
    }

    const draws = publicPicker.draws.draws;
    const pickerName = publicPicker.form.setup.name;

    const hasWinners = draws.length > 0;

    if (!hasWinners) {
      return new ImageResponse(
        (
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
                {pickerName}
              </h1>
              <p
                style={{
                  fontSize: '32px',
                  color: '#1e40af',
                  margin: 0,
                  textAlign: 'center'
                }}
              >
                Winners not yet drawn
              </p>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630
        }
      );
    }

    const winner = draws[0].winner;
    const winnerCount = draws.length;

    return new ImageResponse(
      (
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
                Winner{winnerCount > 1 ? 's' : ''} Announced!
              </h1>
            </div>

            {winner.profile_image_url && (
              <img
                src={winner.profile_image_url}
                alt={winner.name || 'Winner'}
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
              {winner.name && (
                <h2
                  style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: 0
                  }}
                >
                  {winner.name}
                </h2>
              )}
              {winner.username && (
                <p
                  style={{
                    fontSize: '32px',
                    color: '#6b7280',
                    margin: 0
                  }}
                >
                  @{winner.username}
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
                gap: '8px',
                marginTop: '16px'
              }}
            >
              <p
                style={{
                  fontSize: '24px',
                  color: '#78716c',
                  margin: 0,
                  textAlign: 'center',
                  fontWeight: 600
                }}
              >
                {pickerName}
              </p>
              <p
                style={{
                  fontSize: '20px',
                  color: '#a8a29e',
                  margin: 0
                }}
              >
                Verified on Giveaway.dog
              </p>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630
      }
    );
  } catch (error) {
    console.error('[OG Image] Error generating picker image', error);

    return new ImageResponse(
      (
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
          <h1 style={{ fontSize: '48px' }}>Error loading picker</h1>
        </div>
      ),
      {
        width: 1200,
        height: 630
      }
    );
  }
}
