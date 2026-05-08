export function PinViewLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { flag: 14, text: "text-lg", gap: "gap-1.5" },
    md: { flag: 20, text: "text-2xl", gap: "gap-2" },
    lg: { flag: 28, text: "text-4xl", gap: "gap-2.5" },
  };
  const s = sizes[size];

  return (
    <div className={`inline-flex items-center ${s.gap}`}>
      <GolfFlagIcon size={s.flag} />
      <span className={`${s.text} font-black tracking-tight leading-none`}>
        <span className="text-primary">Pin</span>
        <span className="text-white">View</span>
      </span>
    </div>
  );
}

function GolfFlagIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 20 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Flag pole */}
      <line x1="4" y1="2" x2="4" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      {/* Flag */}
      <path d="M4 2 L16 6 L4 10 Z" fill="#22c55e" />
      {/* Base dot */}
      <circle cx="4" cy="22" r="1.5" fill="white" opacity="0.4" />
    </svg>
  );
}
