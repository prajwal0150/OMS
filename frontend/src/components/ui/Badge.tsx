import type { HTMLAttributes, ReactNode } from 'react';

/** Status / category badge. `rounded-full` is semantically correct for a pill. */
export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  primary: 'bg-primary-soft text-primary border-primary/20',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-200',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
  /** Adds a small status dot in front of the label. */
  dot?: boolean;
}

export function Badge({ tone = 'neutral', children, dot = false, className = '', ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[tone]} ${className}`}
      {...rest}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/** Maps a domain status value to the right badge tone. */
export const statusTone = (value?: string | null): BadgeTone => {
  switch (value) {
    case 'ACTIVE':
    case 'PUBLISHED':
    case 'APPROVED':
    case 'PRESENT':
      return 'success';
    case 'PENDING':
    case 'PENDING_REVIEW':
    case 'SCHEDULED':
    case 'ONGOING':
    case 'LATE':
    case 'DRAFT':
      return 'warning';
    case 'INACTIVE':
    case 'SUSPENDED':
    case 'REJECTED':
    case 'CANCELLED':
    case 'ABSENT':
      return 'danger';
    case 'ARCHIVED':
    case 'COMPLETED':
    case 'EXCUSED':
      return 'neutral';
    case 'PUBLIC':
      return 'info';
    case 'MEMBERS_ONLY':
      return 'purple';
    default:
      return 'neutral';
  }
};

export default Badge;
