export default function Mascot({ mood = 'idle', size = 64 }) {
  const happy = mood === 'happy' || mood === 'excited';
  const sad = mood === 'sad';
  const excited = mood === 'excited';
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Questo the owl">
      <ellipse cx="60" cy="66" rx="34" ry="38" fill="#7c3aed" />
      <ellipse cx="60" cy="78" rx="22" ry="24" fill="#f5f3ff" />
      <path d="M26 62 Q14 78 24 92 Q34 84 32 70 Z" fill="#6d28d9" />
      <path d="M94 62 Q106 78 96 92 Q86 84 88 70 Z" fill="#6d28d9" />
      <circle cx="46" cy="52" r="11" fill="#fff" />
      <circle cx="74" cy="52" r="11" fill="#fff" />
      {happy ? (
        <>
          <path d="M40 52 Q46 58 52 52" stroke="#111827" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M68 52 Q74 58 80 52" stroke="#111827" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : sad ? (
        <>
          <circle cx="46" cy="54" r="4" fill="#111827" />
          <circle cx="74" cy="54" r="4" fill="#111827" />
          <path d="M36 42 Q46 36 56 42" stroke="#111827" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M64 42 Q74 36 84 42" stroke="#111827" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="46" cy="54" r="4.5" fill="#111827" />
          <circle cx="74" cy="54" r="4.5" fill="#111827" />
        </>
      )}
      <path d="M60 60 L54 66 L60 72 L66 66 Z" fill="#f59e0b" />
      <circle cx="38" cy="66" r="4" fill="#fda4af" opacity="0.7" />
      <circle cx="82" cy="66" r="4" fill="#fda4af" opacity="0.7" />
      {excited && <path d="M60 44 Q60 36 60 32" stroke="#ffc800" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}
