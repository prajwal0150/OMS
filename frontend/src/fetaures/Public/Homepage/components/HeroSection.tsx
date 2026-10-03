import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '../../../../components';
import lovismLogo from '../../../../assets/lovism.png';
import { EASE } from './motion';
import '../styles/motion.css';

/** Subtle LOVISM depth: desktop pointer parallax, max ~8px / 3deg. Never spins. */
export function LovismVisual() {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 1024) return;
    const rect = el.getBoundingClientRect();
    const ox = (e.clientX - rect.left) / rect.width - 0.5;
    const oy = (e.clientY - rect.top) / rect.height - 0.5;
    requestAnimationFrame(() => {
      el.style.setProperty('--tilt-y', `${(ox * 6).toFixed(2)}deg`);
      el.style.setProperty('--tilt-x', `${(-oy * 4).toFixed(2)}deg`);
    });
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
  }, []);

  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [...EASE], delay: 0.35 }}
      className="relative mx-auto w-44 sm:w-56 lg:w-72"
      style={{ perspective: 900 }}
    >
      <span
        aria-hidden
        className="absolute -inset-[10%] rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.95)_0%,rgba(239,246,255,0.85)_55%,rgba(239,246,255,0)_75%)]"
      />
      <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className="hp-float relative">
        <div className="hp-tilt">
          <img
            src={lovismLogo}
            alt="Lovism"
            draggable={false}
            className="relative w-full object-contain select-none [filter:drop-shadow(0_10px_18px_rgba(15,23,42,0.22))]"
          />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Cinematic hero: staggered text, parallax landscape,
 * LOVISM visual right on desktop / stacked on mobile.
 */
export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#eaf4fb]">

      <svg
        aria-hidden
        viewBox="0 0 1440 420"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5fa8d8" />
            <stop offset="60%" stopColor="#a7d3ec" />
            <stop offset="100%" stopColor="#d8ebf7" />
          </linearGradient>
        </defs>
        <rect width="1440" height="420" fill="url(#hero-sky)" />
        <circle cx="1180" cy="70" r="46" fill="#ffffff" opacity="0.5" />
        {/* Far snow range */}
        <path
          d="M0 250 L110 155 L175 205 L275 95 L360 180 L450 130 L560 215 L660 130 L760 195 L870 100 L985 190 L1090 145 L1200 210 L1310 155 L1440 215 L1440 420 L0 420 Z"
          fill="#dcebf6"
        />
        <path d="M275 95 L318 143 L296 133 L275 145 L255 131 L236 141 Z" fill="#ffffff" />
        <path d="M450 130 L487 172 L467 163 L450 174 L433 161 L417 170 Z" fill="#ffffff" />
        <path d="M870 100 L910 147 L889 137 L870 149 L851 135 L833 145 Z" fill="#ffffff" />
        {/* Mid range */}
        <path
          d="M0 300 L140 225 L250 275 L370 200 L500 285 L620 230 L770 295 L890 225 L1020 285 L1150 240 L1300 295 L1440 255 L1440 420 L0 420 Z"
          fill="#b9d2e5"
        />
        {/* Green hills */}
        <path
          d="M0 335 C 170 300 330 355 500 335 C 680 313 840 360 1010 340 C 1180 320 1330 355 1440 335 L1440 420 L0 420 Z"
          fill="#5b9b6b"
        />
        <path
          d="M0 375 C 230 350 470 395 710 372 C 950 350 1190 395 1440 368 L1440 420 L0 420 Z"
          fill="#3d7d52"
        />
        {/* River winding through the valley */}
        <path
          d="M-10 405 C 280 385 560 415 850 395 C 1100 378 1290 405 1450 390"
          stroke="#93c5e8"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M-10 405 C 280 385 560 415 850 395 C 1100 378 1290 405 1450 390"
          stroke="#cfe8f7"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* Soft white veil so the dark headline stays readable over the sky. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-white/90 via-white/55 to-white/10"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:py-16">
        <div className="min-w-0 text-center lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [...EASE] }}
            className="text-xs font-semibold tracking-wide text-primary"
          >
            Together for a Better Community
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [...EASE], delay: 0.1 }}
            className="mt-3 text-3xl leading-[1.1] font-bold tracking-tight text-secondary sm:text-4xl lg:text-5xl"
          >
            Heavenly Path
            <span className="block text-primary">Sunsari District</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [...EASE], delay: 0.2 }}
            className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-[15px] lg:mx-0"
          >
            Empowering communities, building stronger connections, and creating a brighter future
            for all.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [...EASE], delay: 0.3 }}
            className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start"
          >
            <Link to="/structure">
              <Button
                size="lg"
                className="rounded-full px-5"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Explore Our Organization
              </Button>
            </Link>
            <Link to="/activities">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full bg-white/80 px-5"
                leftIcon={<Play className="h-3.5 w-3.5" />}
              >
                Watch Video
              </Button>
            </Link>
          </motion.div>
        </div>

        <LovismVisual />
      </div>
    </section>
  );
}

export default HeroSection;
