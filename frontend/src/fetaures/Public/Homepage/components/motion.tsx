import type { ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';

/** Shared easing + durations (0.4-0.8s entrance, 0.08-0.15 stagger). */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [...EASE], delay },
  }),
};

export interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

/** Single-shot scroll reveal (viewport once, amount 0.15). */
export function Reveal({ children, delay = 0, y = 30, className }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [...EASE], delay }}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container — children use StaggerItem. */
export function Stagger({
  children,
  className,
  stagger = 0.1,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [...EASE] } },
      }}
    >
      {children}
    </motion.div>
  );
}
