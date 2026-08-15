interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', showTagline = false, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: 'text-lg' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 48, text: 'text-3xl' },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width={s.icon} height={s.icon} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="22" fill="#FEF3C7" />
        <ellipse cx="24" cy="28" rx="10" ry="12" fill="#D97706" />
        <ellipse cx="24" cy="18" rx="8" ry="7" fill="#92400E" />
        <circle cx="20" cy="16" r="1.5" fill="#1F2937" />
        <circle cx="28" cy="16" r="1.5" fill="#1F2937" />
        <path d="M14 12 L10 6 M34 12 L38 6 M20 8 L18 2 M28 8 L30 2" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 32 L8 36 M32 32 L40 36 M18 38 L14 44 M30 38 L34 44" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div>
        <span className={`font-bold tracking-tight text-gray-900 ${s.text}`}>
          Task<span className="text-brand-600">Ant</span>
        </span>
        {showTagline && (
          <p className="text-xs text-gray-500 -mt-0.5">Your Task. Our Ant.</p>
        )}
      </div>
    </div>
  );
}
