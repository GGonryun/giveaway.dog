import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
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
          'linear-gradient(to bottom right, #fef3c7, #fde68a, #fcd34d)'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}
      >
        <div
          style={{
            fontSize: '96px',
            marginBottom: '20px'
          }}
        >
          🎁
        </div>
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 'bold',
            background:
              'linear-gradient(to bottom right, #f59e0b, #d97706, #b45309)',
            backgroundClip: 'text',
            color: 'transparent',
            margin: 0
          }}
        >
          Browse Active Giveaways
        </h1>
        <p
          style={{
            fontSize: '32px',
            color: '#92400e',
            margin: 0,
            textAlign: 'center'
          }}
        >
          Win Amazing Prizes from Brands & Creators
        </p>
      </div>
    </div>,
    {
      width: 1200,
      height: 630
    }
  );
}
