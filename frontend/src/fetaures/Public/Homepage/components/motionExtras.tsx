import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';

/** Subtle 3D hover: y -4, scale 1.01, 1deg tilt. Never spins. */
export function MotionCard({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={{ transformPerspective: 900 }}
      whileHover={{ y: -4, scale: 1.01, rotateX: 1, rotateY: -1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

/** Gentle idle float for decorative shapes only. */
export function FloatingElement({
  children,
  className,
  amplitude = 8,
  duration = 6,
}: {
  children: ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -amplitude, 0] }}
      transition={{ duration, ease: 'easeInOut', repeat: Infinity }}
    >
      {children}
    </motion.div>
  );
}

/** Animates REAL API numbers only — never invent statistics. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) {
      if (reduce) setDisplay(value);
      return;
    }
    const start = performance.now();
    const dur = 1200;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString()}
    </span>
  );
}

/** Compact editorial heading for story sections. */
export function StoryHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className="text-xs font-semibold tracking-widest text-primary uppercase">{eyebrow}</p>
      <h2 className="mt-1.5 text-xl font-bold tracking-tight text-secondary sm:text-2xl">{title}</h2>
      {description && <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>}
    </div>
  );
}
