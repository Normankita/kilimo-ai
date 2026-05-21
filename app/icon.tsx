import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: 'linear-gradient(145deg, #2a5c3f, #1a3828)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          {/* Left leaf */}
          <path fill="white" d="M12 13C12 9 9 5 5 3C5 7 8 11 12 13Z" />
          {/* Right leaf */}
          <path fill="white" d="M12 13C12 9 15 5 19 3C19 7 16 11 12 13Z" />
          {/* Stem */}
          <rect fill="white" x="11" y="12" width="2.5" height="9" rx="1.25" />
        </svg>
      </div>
    ),
    { ...size },
  )
}
