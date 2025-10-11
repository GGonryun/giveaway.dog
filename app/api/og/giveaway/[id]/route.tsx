import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import getParticipantSweepstake from '@/procedures/browse/get-participant-sweepstake';
import { date } from '@/lib/date';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await getParticipantSweepstake({ sweepstakesId: id });

  if (!result.ok) {
    return new Response('Giveaway not found', { status: 404 });
  }

  const { sweepstakes, host } = result.data;
  const prizeNames = sweepstakes.prizes.map((p) => p.name).join(', ');
  const endDate = date.format(sweepstakes.timing.endDate);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff',
          backgroundImage:
            'linear-gradient(to bottom right, #f0f9ff, #e0f2fe, #bae6fd)'
        }}
      >
        {sweepstakes.setup.banner && (
          <div
            style={{
              height: '300px',
              width: '100%',
              display: 'flex',
              overflow: 'hidden'
            }}
          >
            <img
              src={sweepstakes.setup.banner}
              alt={sweepstakes.setup.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '40px',
            gap: '20px',
            flex: 1,
            justifyContent: 'center'
          }}
        >
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#0f172a',
              margin: 0,
              lineHeight: 1.2
            }}
          >
            {sweepstakes.setup.name}
          </h1>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <p
              style={{
                fontSize: '28px',
                color: '#64748b',
                margin: 0
              }}
            >
              🏆 Win: {prizeNames}
            </p>
            <p
              style={{
                fontSize: '24px',
                color: '#94a3b8',
                margin: 0
              }}
            >
              ⏰ Ends: {endDate} | By {host.name}
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
}
