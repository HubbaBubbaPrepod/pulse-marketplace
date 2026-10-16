import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#080808',
        color: '#f5f5f5',
        padding: 76,
      }}
    >
      <div style={{ display: 'flex', fontSize: 27, letterSpacing: 5 }}>PULSE / MARKETPLACE</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', fontSize: 78, fontWeight: 700, letterSpacing: -4 }}>
          Your server. More possibilities.
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#a5a5a5' }}>
          Open-source modules for Pulse Monitor
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid #444',
          paddingTop: 25,
          fontSize: 22,
        }}
      >
        <span>LINUX + WINDOWS</span>
        <span>marketplace.hubba-cloud.ru</span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
