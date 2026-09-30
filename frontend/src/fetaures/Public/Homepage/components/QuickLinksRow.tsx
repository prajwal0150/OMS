import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MapPin, Newspaper, UsersRound, type LucideIcon } from 'lucide-react';

interface QuickLink {
  label: string;
  desc: string;
  icon: LucideIcon;
  tile: string;
  to: string;
}

const LINKS: QuickLink[] = [
  {
    label: 'Our Organization',
    desc: 'Learn about our mission, vision and values',
    icon: UsersRound,
    tile: 'bg-blue-50 text-blue-600',
    to: '/about',
  },
  {
    label: 'District & Units',
    desc: 'Explore our district and its units',
    icon: MapPin,
    tile: 'bg-emerald-50 text-emerald-600',
    to: '/district',
  },
  {
    label: 'Communities',
    desc: 'Parents, Women and Youth communities',
    icon: UsersRound,
    tile: 'bg-violet-50 text-violet-600',
    to: '/communities',
  },
  {
    label: 'Events',
    desc: 'Join our upcoming events and programs',
    icon: CalendarDays,
    tile: 'bg-orange-50 text-orange-500',
    to: '/events',
  },
  {
    label: 'Latest News',
    desc: 'Stay updated with our latest activities',
    icon: Newspaper,
    tile: 'bg-teal-50 text-teal-600',
    to: '/content',
  },
];

export interface QuickLinksRowProps {
  /** Live unit total, injected into the "District & Units" description. */
  unitCount?: number;
}

/** Five shortcut cards shown directly below the hero. */
export function QuickLinksRow({ unitCount }: QuickLinksRowProps) {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {LINKS.map((link) => {
        const desc =
          link.label === 'District & Units' && unitCount
            ? `Explore our district and ${unitCount} units`
            : link.desc;
        return (
          <Link
            key={link.label}
            to={link.to}
            className="group flex items-start gap-3 rounded-lg border border-line bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${link.tile}`}
            >
              <link.icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-secondary group-hover:text-primary">
                {link.label}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-muted">{desc}</span>
            </span>
            <ArrowRight
              className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden
            />
          </Link>
        );
      })}
    </div>
  );
}

export default QuickLinksRow;
