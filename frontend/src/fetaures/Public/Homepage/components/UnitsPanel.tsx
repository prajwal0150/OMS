import { Link } from 'react-router-dom';
import { ArrowRight, Building2 } from 'lucide-react';
import { EmptyState, ErrorState, Skeleton } from '../../../../components';
import type { Unit } from '../../../../types';
import { PanelHeader } from './PanelHeader';

interface ThumbPalette {
  sky: string;
  back: string;
  front: string;
  building: string;
}

/** Four colour variants so each unit thumbnail feels distinct. */
const PALETTES: ThumbPalette[] = [
  { sky: '#7dd3fc', back: '#86efac', front: '#16a34a', building: '#334155' },
  { sky: '#a5b4fc', back: '#6ee7b7', front: '#059669', building: '#3f3f46' },
  { sky: '#fcd34d', back: '#bef264', front: '#65a30d', building: '#44403c' },
  { sky: '#67e8f9', back: '#99f6e4', front: '#0d9488', building: '#1e293b' },
];

/** Illustrated town scene used as the unit card thumbnail. */
function UnitThumb({ index }: { index: number }) {
  const palette = PALETTES[index % PALETTES.length];
  return (
    <svg
      viewBox="0 0 200 80"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-hidden
    >
      <rect width="200" height="80" fill={palette.sky} />
      <circle cx="172" cy="15" r="9" fill="#fef3c7" />
      <path d="M0 52 L36 26 L74 52 Z" fill={palette.back} />
      <path d="M52 52 L96 22 L140 52 Z" fill={palette.back} opacity="0.8" />
      <path d="M120 52 L160 30 L200 52 Z" fill={palette.back} />
      <rect x="30" y="38" width="16" height="26" fill={palette.building} />
      <rect x="52" y="30" width="14" height="34" fill={palette.building} />
      <rect x="96" y="34" width="18" height="30" fill={palette.building} />
      <rect x="126" y="42" width="12" height="22" fill={palette.building} />
      <rect x="34" y="42" width="3" height="4" fill="#fde047" />
      <rect x="39" y="42" width="3" height="4" fill="#fde047" />
      <rect x="56" y="34" width="3" height="4" fill="#fde047" />
      <rect x="61" y="34" width="3" height="4" fill="#fde047" />
      <rect x="100" y="38" width="4" height="4" fill="#fde047" />
      <rect x="107" y="38" width="4" height="4" fill="#fde047" />
      <rect x="0" y="62" width="200" height="18" fill={palette.front} />
      <rect x="0" y="62" width="200" height="2" fill="#ffffff" opacity="0.25" />
    </svg>
  );
}

export interface UnitsPanelProps {
  items: Unit[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

/** "Our Units" panel: four illustrated unit cards with a hover arrow. */
export function UnitsPanel({ items, loading, error, onRetry }: UnitsPanelProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-line bg-white shadow-sm">
      <PanelHeader
        icon={<Building2 className="h-[18px] w-[18px]" />}
        title="Our Units"
        viewAllTo="/structure"
      />
      <div className="p-4">
        {error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-line p-0">
                <Skeleton className="h-20 w-full rounded-none" />
                <div className="px-3 py-2.5">
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No units yet"
            description="The district's units will appear here once they are published."
            icon={<Building2 className="h-5 w-5" />}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {items.map((unit, index) => (
              <Link
                key={unit._id}
                to="/structure"
                className="group overflow-hidden rounded-lg border border-line bg-white transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span className="block h-20 overflow-hidden">
                  <UnitThumb index={index} />
                </span>
                <span className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <span className="truncate text-[13px] font-semibold text-secondary group-hover:text-primary">
                    {unit.name}
                  </span>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <ArrowRight className="h-3 w-3" aria-hidden />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default UnitsPanel;
