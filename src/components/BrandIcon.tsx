export function BrandIcon({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-lg flex items-center justify-center shrink-0"
      style={{ width: size, height: size, backgroundColor: '#0F1C3A' }}
    >
      <svg viewBox="0 0 512 512" style={{ width: size * 0.65, height: size * 0.65 }}>
        <rect x="150" y="90" width="220" height="280" rx="12" fill="#F5F3E8"/>
        <rect x="185" y="150" width="150" height="12" rx="3" fill="#0F1C3A"/>
        <rect x="185" y="185" width="120" height="12" rx="3" fill="#0F1C3A"/>
        <rect x="185" y="220" width="90" height="12" rx="3" fill="#0F1C3A"/>
        <rect x="290" y="260" width="80" height="80" rx="16" fill="#2DC4A7"/>
        <rect x="322" y="282" width="16" height="36" rx="4" fill="white"/>
        <rect x="312" y="292" width="36" height="16" rx="4" fill="white"/>
      </svg>
    </div>
  )
}
