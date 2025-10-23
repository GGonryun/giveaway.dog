import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'GiveawayDog - Build better giveaways and contests';
export const size = {
  width: 1200,
  height: 630
};

export const contentType = 'image/png';

export default async function Image() {
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
          backgroundColor: '#8b5cf6',
          backgroundImage:
            'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.15) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.15) 2%, transparent 0%)',
          backgroundSize: '100px 100px'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px'
          }}
        >
          <div
            style={{
              fontSize: 120,
              fontWeight: 800,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.2,
              letterSpacing: '-0.02em'
            }}
          >
            🐶 GiveawayDog
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              maxWidth: '800px'
            }}
          >
            Build better giveaways and contests
          </div>
        </div>
      </div>
    ),
    {
      ...size
    }
  );
}
