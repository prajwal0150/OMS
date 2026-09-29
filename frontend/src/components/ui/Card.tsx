import type { HTMLAttributes, ReactNode } from 'react';

/** Compact surface primitives - the base of the whole design system. */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md';
}

const PADDING = { none: '', sm: 'p-3', md: 'p-4' } as const;

export function Card({ padding = 'md', className = '', children, ...rest }: CardProps) {
  return (
    <div className={`rounded-lg border border-line bg-white shadow-sm ${PADDING[padding]} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, actions, icon, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div className="flex min-w-0 items-start gap-2">
        {icon && <span className="mt-0.5 shrink-0 text-primary">{icon}</span>}
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-secondary">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: Array<{ label: string; to?: string }>;
}

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1.5 text-xs text-muted">
            {breadcrumb.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && <span aria-hidden>/</span>}
                <span className={index === breadcrumb.length - 1 ? 'text-slate-600' : ''}>
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-semibold text-secondary">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  trend?: { value: string; positive: boolean };
  onClick?: () => void;
}

export function StatCard({ label, value, icon, hint, trend, onClick }: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-xs font-medium tracking-wide text-muted uppercase">{label}</p>
        {icon && <span className="shrink-0 text-primary">{icon}</span>}
      </div>
      <p className="mt-1.5 text-2xl leading-tight font-semibold text-secondary">{value}</p>
      {(hint || trend) && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          {trend && (
            <span className={trend.positive ? 'font-medium text-success' : 'font-medium text-danger'}>
              {trend.value}
            </span>
          )}
          {hint && <span className="truncate text-muted">{hint}</span>}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-lg border border-line bg-white p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
      >
        {content}
      </button>
    );
  }

  return <div className="rounded-lg border border-line bg-white p-4 shadow-sm">{content}</div>;
}

export interface SectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ title, description, actions, children, className = '' }: SectionProps) {
  return (
    <section className={`space-y-3 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold text-secondary">{title}</h2>}
            {description && <p className="text-xs text-muted">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
