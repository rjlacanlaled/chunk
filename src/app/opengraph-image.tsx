import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Chunk — AI Productivity Agent';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #060D1F 0%, #0C1530 50%, #111936 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(73,69,255,0.25) 0%, rgba(151,54,232,0.08) 50%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Logo icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: '#4945FF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '16px',
            gap: '6px',
            marginBottom: '32px',
          }}
        >
          <div style={{ width: '48px', height: '8px', borderRadius: '4px', background: 'white' }} />
          <div style={{ width: '36px', height: '8px', borderRadius: '4px', background: 'white', opacity: 0.7 }} />
          <div style={{ width: '24px', height: '8px', borderRadius: '4px', background: 'white', opacity: 0.4 }} />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-2px',
            lineHeight: 1.1,
            textAlign: 'center',
          }}
        >
          chunk
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '28px',
            color: 'rgba(255,255,255,0.5)',
            marginTop: '16px',
            textAlign: 'center',
          }}
        >
          Your chaos, made manageable.
        </div>

        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '40px',
            background: 'rgba(73,69,255,0.15)',
            border: '1px solid rgba(73,69,255,0.3)',
            borderRadius: '100px',
            padding: '8px 20px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#4945FF',
            }}
          />
          <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
            AI Productivity Agent
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
