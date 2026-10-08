import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useLocation } from 'react-router-dom';

/** Smooth public page transition: opacity 0->1, y 10->0, 0.25-0.4s. */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const { pathname } = useLocation();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
export default PageTransition;
