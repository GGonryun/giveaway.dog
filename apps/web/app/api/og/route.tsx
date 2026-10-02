import { ImageResponse } from 'next/og';

export async function GET() {
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
          'linear-gradient(to bottom right, #f0f9ff, #e0f2fe, #bae6fd)'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}
      >
        <h1
          style={{
            fontSize: '80px',
            fontWeight: 'bold',
            background:
              'linear-gradient(to bottom right, #0ea5e9, #3b82f6, #6366f1)',
            backgroundClip: 'text',
            color: 'transparent',
            margin: 0,
            padding: 0
          }}
        >
          Giveaway.dog
        </h1>
        <p
          style={{
            fontSize: '32px',
            color: '#64748b',
            margin: 0,
            textAlign: 'center',
            maxWidth: '800px'
          }}
        >
          Create and Host Viral Giveaways & Contests
        </p>
      </div>
    </div>,
    {
      width: 1200,
      height: 630
    }
  );

  response.headers.set(
    'Cache-Control',
    'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
  );

  return response;
}
