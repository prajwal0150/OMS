import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '../../../../components';

/**
 * Full-bleed marketing hero: illustrated mountain landscape, dark navy overlay,
 * headline, CTAs and the hand-written tagline on the right.
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
            <Link to="/communities">
              <Button
                size="lg"
                className="rounded-full px-5"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Explore Our Community
              </Button>
            </Link>
            <Link to="/content">
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

        <p
          className="hidden shrink-0 -rotate-2 text-right text-4xl leading-tight font-semibold text-white/90 lg:block xl:text-5xl"
          style={{ fontFamily: "'Caveat', cursive" }}
        >
          Stronger Communities
          <span className="block">Brighter Future</span>
        </p>
      </div>
    </section>
  );
}

export default HeroSection;
