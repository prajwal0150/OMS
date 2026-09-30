import { useId } from 'react';

export interface OrganizationLogoProps {
  /** Sized via Tailwind classes, e.g. `h-9 w-9`. */
  className?: string;
}

/**
 * Circular illustrated emblem (snow peaks, green hills and a river) used in the
 * public header, footer and marketing sections. Pure inline SVG so it renders
 * without any image asset.
 */
export function OrganizationLogo({ className = 'h-9 w-9' }: OrganizationLogoProps) {
  const clipId = useId();

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 48 48" className="h-full w-full">
        <defs>
          <clipPath id={clipId}>
            <circle cx="24" cy="24" r="24" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect width="48" height="48" fill="#7dd3fc" />
          <circle cx="35" cy="11" r="5" fill="#fde047" />
          {/* Snow-capped range */}
          <path d="M-2 34 L12 13 L22 25 L30 17 L50 35 L50 50 L-2 50 Z" fill="#dcebf6" />
          <path d="M12 13 L16.5 19 L14 18 L12 20 L9.5 18 L7.5 19 Z" fill="#ffffff" />
          <path d="M30 17 L34 22 L31.5 21 L30 23 L28 21 L26.5 22 Z" fill="#ffffff" />
          {/* Green hills */}
          <path d="M-2 40 C8 33 18 41 26 37 C34 33 42 39 50 35 L50 50 L-2 50 Z" fill="#22c55e" />
          <path d="M-2 44 C10 40 20 46 32 42 C40 39.5 46 43 50 41.5 L50 50 L-2 50 Z" fill="#15803d" />
          {/* River */}
          <path
            d="M-2 47 C12 43.5 24 49 36 45.5 C42 43.8 47 45 50 44"
            stroke="#bae6fd"
            strokeWidth="3"
            fill="none"
          />
        </g>
      </svg>
    </span>
  );
}

export default OrganizationLogo;
