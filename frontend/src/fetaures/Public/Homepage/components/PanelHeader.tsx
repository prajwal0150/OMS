import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export interface PanelHeaderProps {
  /** Usually a lucide icon already sized to `h-[18px] w-[18px]`. */
  icon: ReactNode;
  title: string;
  /** When set, renders the blue "View All" link on the right. */
  viewAllTo?: string;
  viewAllLabel?: string;
}

/** Shared header row for the homepage content panels (icon + title + View All). */
export function PanelHeader({ icon, title, viewAllTo, viewAllLabel = 'View All' }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-secondary">
        <span className="shrink-0 text-primary">{icon}</span>
        <span className="truncate">{title}</span>
      </h2>
      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="flex shrink-0 items-center gap-1 text-xs font-medium whitespace-nowrap text-primary hover:underline"
        >
          {viewAllLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export default PanelHeader;
