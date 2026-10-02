import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '../../../../components';
import lovismLogo from '../../../../assets/lovism.png';

/** How far the medallion follows the pointer, in degrees across half the bubble. */
const TILT_RANGE = 18;

/**
 * Animated Lovism medallion shown on the right of the homepage hero.
 *
 * Structure and presentation stay in Tailwind utility classes; every moving
 * part is driven by `styles/motion.css`. JavaScript supplies the motion: the
 * pointer position is written into the `--tilt-x` / `--tilt-y` custom
 * properties on every animation frame, and an IntersectionObserver plus a
 * `prefers-reduced-motion` check drive the `data-anim` attribute that parks all
 * animations when they are not needed.
 */
function LovismMark() {
  const brandRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const brand = brandRef.current;
    // Touch already scrolls and pins, so only mouse/pen drive the tilt.
    if (!brand || event.pointerType === 'touch') return;

    const rect = brand.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
    const offsetY = (event.clientY - rect.top) / rect.height - 0.5;

    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      brand.style.setProperty('--tilt-y', `${(offsetX * TILT_RANGE * 2).toFixed(2)}deg`);
      brand.style.setProperty('--tilt-x', `${(-offsetY * TILT_RANGE * 1.4).toFixed(2)}deg`);
    });
  }, []);

  const resetTilt = useCallback(() => {
    const brand = brandRef.current;
    if (!brand) return;

    cancelAnimationFrame(frameRef.current);
    brand.style.setProperty('--tilt-x', '0deg');
    brand.style.setProperty('--tilt-y', '0deg');
  }, []);

  useEffect(() => {
    const brand = brandRef.current;
    if (!brand) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inView = true;

    const syncAnimationState = () => {
      brand.dataset.anim = inView && !motionQuery.matches ? 'on' : 'off';
    };

    const observer = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        syncAnimationState();
      },
      { threshold: 0.1 },
    );
    observer.observe(brand);
    motionQuery.addEventListener('change', syncAnimationState);
    syncAnimationState();

    return () => {
      observer.disconnect();
      motionQuery.removeEventListener('change', syncAnimationState);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      ref={brandRef}
      data-anim="on"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      className="flex shrink-0 items-center justify-center gap-2 self-center sm:gap-5 sm:self-auto xl:gap-7"
    >
      <div className="relative size-28 shrink-0 sm:size-40 md:size-48 xl:size-64">
        {/* Dashed halo ring orbiting behind the bubble. */}
        <span
          aria-hidden
          className="hp-orbit pointer-events-none absolute -inset-[14%] rounded-full border border-dashed border-white/30"
        />
        <span
          aria-hidden
          className="hp-twinkle pointer-events-none absolute top-[2%] right-[4%] size-3.5 bg-white/90 [clip-path:polygon(50%_0%,61%_39%,100%_50%,61%_61%,50%_100%,39%_61%,0%_50%,39%_39%)]"
        />
        <span
          aria-hidden
          className="hp-twinkle hp-twinkle--delay pointer-events-none absolute bottom-[6%] left-[-1%] size-2.5 bg-white/90 [clip-path:polygon(50%_0%,61%_39%,100%_50%,61%_61%,50%_100%,39%_61%,0%_50%,39%_39%)]"
        />

        {/* Glassy bubble; `hp-float` supplies the bobbing. */}
        <div
          className="hp-float hp-flip-stage absolute inset-0 flex items-center justify-center rounded-full bg-[radial-gradient(circle_at_34%_28%,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.62)_38%,rgba(207,232,250,0.42)_70%,rgba(147,197,232,0.34)_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),inset_0_0_45px_10px_rgba(255,255,255,0.5),0_20px_45px_-18px_rgba(3,22,48,0.55)]"
        >
          {/* Pointer tilt wraps the card so the flip composes in 3D. */}
          <div className="hp-tilt absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
            <div className="hp-flipper relative aspect-[813/996] w-1/2">
              <div className="hp-flip-face absolute inset-0 flex items-center justify-center">
                <img
                  src={lovismLogo}
                  alt="Lovism"
                  className="h-full w-full -webkit-user-drag-none object-contain [filter:drop-shadow(0_8px_16px_rgba(122,0,0,0.4))] select-none"
                  draggable={false}
                />
              </div>
              {/* Mirrored twin, so the flip still shows the mark if the angle
                  in `hp-flip` is ever raised past 90deg. */}
              <div
                aria-hidden
                className="hp-flip-face hp-flip-face--back absolute inset-0 flex items-center justify-center"
              >
                <img
                  src={lovismLogo}
                  alt=""
                  className="h-full w-full -webkit-user-drag-none object-contain [filter:drop-shadow(0_8px_16px_rgba(122,0,0,0.4))] select-none"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Handwritten tagline; `hp-sway` supplies the gentle rock. */}
      <p
        className="hp-sway m-0 min-w-0 text-right text-2xl font-bold text-white/95 [font-family:'Caveat','Segoe_Script',cursive] [text-shadow:0_2px_14px_rgba(3,22,48,0.5)] sm:text-3xl xl:text-4xl"
        style={{ lineHeight: 1.05 }}
      >
        <span className="block">Stronger</span>
        <span className="block">Communities</span>
        <span className="mt-[0.18em] block">Brighter</span>
        <span className="block">Future</span>
      </p>
    </div>
  );
}

/**
 * Full-bleed marketing hero: illustrated mountain landscape, dark navy overlay,
 * headline, CTAs and the animated Lovism brand mark with the tagline on the right.
 */
export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0b2444]">
      {/* Handwriting accent font, loaded only on the homepage hero. */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap');`}</style>

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

      {/* Navy readability overlay, darker on the left where the copy sits. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-r from-[#0a1e3a]/90 via-[#0a1e3a]/75 to-[#0a1e3a]/40"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-[#0a1e3a]/50 via-transparent to-transparent"
      />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 lg:flex-row lg:items-center lg:justify-between lg:py-16">
        <div className="max-w-xl">
          <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
            Together for a Better Community
          </span>

          <h1 className="mt-5 text-4xl leading-[1.08] font-bold tracking-tight text-white sm:text-5xl">
            Heavenly Path
            <span className="block text-sky-400">Sunsari District</span>
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-[15px]">
            Empowering communities, building stronger connections, and creating a brighter future
            for all.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/structure">
              <Button
                size="lg"
                className="rounded-full px-5"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Explore Our Community
              </Button>
            </Link>
            <Link to="/activities">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-white/60 bg-white/10 px-5 text-white hover:bg-white/20"
                leftIcon={<Play className="h-3.5 w-3.5" />}
              >
                Watch Video
              </Button>
            </Link>
          </div>
        </div>

        <LovismMark />
      </div>
    </section>
  );
}

export default HeroSection;
