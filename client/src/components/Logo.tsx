
interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({
  className = '',
  showTagline = false,
  size = 'md',
}: LogoProps) {
  const sizes = {
    sm: 100,
    md: 100,
    lg: 100,
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/taskant-logo.png"
        alt="TaskAnt Logo"
        width={sizes[size]}
        height={sizes[size]}
        className="object-contain shrink-0"
      />

      {showTagline && (
        <p className="text-xs text-gray-500">
          Your Task. Our Ant.
        </p>
      )}
    </div>
  );
}
