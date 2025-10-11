import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
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
            'linear-gradient(to bottom right, #ecfdf5, #d1fae5, #a7f3d0)'
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
            💎
          </div>
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              background:
                'linear-gradient(to bottom right, #10b981, #059669, #047857)',
              backgroundClip: 'text',
              color: 'transparent',
              margin: 0
            }}
          >
            Simple, Transparent Pricing
          </h1>
          <p
            style={{
              fontSize: '32px',
              color: '#065f46',
              margin: 0,
              textAlign: 'center'
            }}
          >
            Start Free • Pay Only for What You Need
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
