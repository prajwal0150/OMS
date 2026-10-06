import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Megaphone, Newspaper, UsersRound } from 'lucide-react';
import { Skeleton } from '../../../../components';
import { Button } from '../../../../components';
import { Reveal, Stagger, StaggerItem } from './motion';
import { CountUp, MotionCard, StoryHeading } from './motionExtras';

export function ImpactStrip({ totals, loading }: { totals: { label: string; value: number; hint: string }[]; loading: boolean }) {
  if (loading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 pt-10 sm:pt-14">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (<Skeleton key={i} className="h-24 w-full rounded-lg" />))}
        </div>
      </section>
    );
  }
  if (totals.length === 0) return null;
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-10 sm:pt-14">
      <StoryHeading eyebrow="Real progress" title="Our footprint in numbers" description="Only live totals from the platform — never invented." align="center" />
      <Stagger className="mx-auto mt-5 grid max-w-4xl grid-cols-2 gap-3 lg:grid-cols-4" stagger={0.08}>
        {totals.map((t) => (
          <StaggerItem key={t.label}>
            <div className="rounded-lg border border-line bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-secondary"><CountUp value={t.value} /></p>
              <p className="mt-1 text-xs font-semibold text-secondary">{t.label}</p>
              <p className="text-[11px] text-muted">{t.hint}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

const ICONS = [Newspaper, CalendarDays, Megaphone, UsersRound];

export function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-10 pb-12 sm:pt-14">
      <Reveal>
        <div className="relative overflow-hidden rounded-lg bg-secondary px-5 py-8 text-center shadow-sm sm:py-10">
          <span aria-hidden className="pointer-events-none absolute -top-16 left-1/4 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <span aria-hidden className="pointer-events-none absolute -right-10 -bottom-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
          <p className="relative text-xs font-semibold tracking-widest text-sky-300 uppercase">Get involved</p>
          <h2 className="relative mx-auto mt-2 max-w-xl text-xl font-bold tracking-tight text-white sm:text-2xl">Be part of our community story</h2>
          <p className="relative mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-300">Follow activities, join upcoming events and reach out to your nearest unit.</p>
          <div className="relative mt-5 flex flex-wrap justify-center gap-2.5">
            <Link to="/activities"><Button size="sm" className="rounded-full px-4" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>Explore activities</Button></Link>
            <Link to="/activities"><Button size="sm" variant="outline" className="rounded-full border-white/20 bg-white/10 px-4 text-white hover:bg-white/20">View events</Button></Link>
            <Link to="/contact"><Button size="sm" variant="ghost" className="rounded-full px-4 text-slate-200 hover:bg-white/10 hover:text-white">Contact us</Button></Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function QuickPeek({ items }: { items: { to: string; label: string; desc: string }[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Explore more" className="mx-auto w-full max-w-7xl px-4 pt-8">
      <Stagger className="grid grid-cols-2 gap-2.5 lg:grid-cols-4" stagger={0.07}>
        {items.map((item, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <StaggerItem key={item.to + item.label}>
              <MotionCard className="h-full rounded-lg border border-line bg-white shadow-sm">
                <Link to={item.to} className="group flex items-center gap-2.5 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"><Icon className="h-4 w-4" aria-hidden /></span>
                  <span className="min-w-0"><span className="block truncate text-[13px] font-semibold text-secondary group-hover:text-primary">{item.label}</span><span className="block truncate text-[11px] text-muted">{item.desc}</span></span>
                </Link>
              </MotionCard>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}
