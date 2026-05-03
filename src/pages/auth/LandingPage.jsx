import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MapPin, Package, Shield, ArrowRight, Home, Wrench,
  Zap, Heart, Users, ClipboardCheck, UserCheck, Map,
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

/* ------------------------------------------------------------------ */
/*  Scroll-reveal wrapper                                              */
/* ------------------------------------------------------------------ */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini SVG illustrations for feature cards                           */
/* ------------------------------------------------------------------ */
function MapIllustration() {
  return (
    <svg viewBox="0 0 280 160" className="w-full" aria-hidden="true">
      {/* Neighborhood polygon */}
      <path d="M40 120 L80 40 L180 30 L240 60 L250 130 L140 140 Z" fill="none" stroke="#4DB8A0" strokeWidth="1.5" opacity="0.4" />
      <path d="M40 120 L80 40 L180 30 L240 60 L250 130 L140 140 Z" fill="#4DB8A0" opacity="0.06" />
      {/* Dots — neighbors */}
      {[[90, 60], [140, 50], [200, 55], [110, 90], [170, 85], [220, 95], [80, 115], [150, 120], [210, 125]].map(([x, y], i) => (
        <motion.circle
          key={i} cx={x} cy={y} r="4"
          fill="#4DB8A0" opacity="0.5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 + i * 0.08, duration: 0.4 }}
        />
      ))}
      {/* Your pin */}
      <motion.g initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.5, duration: 0.5, type: 'spring' }}>
        <path d="M140 75 C140 75 125 95 125 105 C125 113 132 118 140 118 C148 118 155 113 155 105 C155 95 140 75 140 75Z" fill="#C4782A" />
        <circle cx="140" cy="105" r="5" fill="rgba(255,255,255,0.3)" />
      </motion.g>
    </svg>
  );
}

function ResourceIllustration() {
  const items = [
    { icon: Zap, label: 'Power' },
    { icon: Heart, label: 'Medical' },
    { icon: Wrench, label: 'Tools' },
    { icon: Home, label: 'Shelter' },
  ];
  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          className="flex flex-col items-center gap-1.5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 + i * 0.12, duration: 0.4 }}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-600/15 text-amber-500">
            <item.icon className="size-5" strokeWidth={1.5} />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

function CheckInIllustration() {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-600"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <Shield className="size-7" strokeWidth={1.5} />
      </motion.div>
      <div className="flex items-center gap-1.5">
        <motion.div
          className="h-2 w-2 rounded-full bg-teal-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
        />
        <motion.div
          className="h-2 w-2 rounded-full bg-teal-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
        />
        <motion.div
          className="h-2 w-2 rounded-full bg-teal-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}
        />
      </div>
      <span className="text-xs font-medium text-teal-600/80">Sent to 3 contacts</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing Page                                                       */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  const { t } = useTranslation();


  function scrollToHowItWorks() {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ============================================================ */}
      {/*  Sticky Nav                                                   */}
      {/* ============================================================ */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/auth/landing" className="flex items-center gap-2">
            <img src="/images/logo_wide.png" alt="ReadyBlock" className="h-8 sm:h-9" />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher fixed={false} />
            <Link to="/auth/sign-in" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-block">
              {t('landing.nav.signIn')}
            </Link>
            <Button asChild size="sm">
              <Link to="/auth/sign-up">{t('landing.nav.getStarted')}</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ============================================================ */}
      {/*  Hero                                                         */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-linear-to-br from-teal-700 via-teal-600 to-teal-800">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <svg className="absolute -top-32 -left-32 h-125 w-125 opacity-10" viewBox="0 0 500 500"><circle cx="250" cy="250" r="250" fill="white" /></svg>
          <svg className="absolute -bottom-24 -right-24 h-100 w-100 opacity-[0.07]" viewBox="0 0 400 400"><circle cx="200" cy="200" r="200" fill="white" /></svg>
          <svg className="absolute top-1/2 left-1/2 h-75 w-75 -translate-x-1/2 -translate-y-1/2 opacity-[0.04]" viewBox="0 0 300 300"><circle cx="150" cy="150" r="150" fill="white" /></svg>
        </div>
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:py-28 md:py-36">
          <motion.div className="mb-8" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
            <img src="/images/logo.png" alt="" className="h-28 w-auto brightness-125 drop-shadow-[0_4px_24px_rgba(255,255,255,0.25)] sm:h-32" aria-hidden="true" />
          </motion.div>
          <motion.h1
            className="mb-6 text-3xl leading-tight text-white sm:text-4xl md:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
          >
            {t('app.tagline_line1')}<br />
            {t('app.tagline_line2')}<br />
            {t('app.tagline_line3')}
          </motion.h1>
          <motion.p className="mb-10 max-w-xl text-base leading-relaxed text-teal-50/90 sm:text-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}>
            {t('landing.hero.subtitle')}
          </motion.p>
          <motion.div className="flex flex-col items-center gap-3 sm:flex-row" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
            <Button asChild size="lg" className="bg-amber-600 text-white hover:bg-amber-700">
              <Link to="/auth/sign-up">{t('landing.hero.cta')}<ArrowRight className="ml-1 size-4" /></Link>
            </Button>
            <Button variant="ghost" size="lg" className="border border-white/30 text-white hover:bg-white/10 hover:text-white" onClick={scrollToHowItWorks}>
              {t('landing.hero.learnMore')}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Features — Bento Grid                                        */}
      {/* ============================================================ */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <h2 className="mb-3 text-center text-2xl text-foreground sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
              {t('landing.features.title')}
            </h2>
            <p className="mx-auto mb-14 max-w-lg text-center text-sm text-muted-foreground sm:text-base">
              {t('landing.features.subtitle')}
            </p>
          </Reveal>

          {/* Bento grid: large left card + two stacked right cards */}
          <div className="grid gap-4 md:grid-cols-5 md:grid-rows-2">
            {/* Map Your Block — spans 3 cols, 2 rows */}
            <Reveal className="md:col-span-3 md:row-span-2">
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-teal-200 bg-teal-50 p-6 transition-all duration-300 hover:border-teal-300 hover:shadow-[0_0_40px_-12px_rgba(77,184,160,0.15)] sm:p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                  <MapPin className="size-5" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('landing.features.map.title')}
                </h3>
                <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {t('landing.features.map.description')}
                </p>
                {/* Interactive map illustration */}
                <div className="mt-auto rounded-xl border border-teal-200 bg-teal-100/50 p-4">
                  <MapIllustration />
                </div>
                {/* Glow on hover */}
                <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-teal-200/30 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
              </div>
            </Reveal>

            {/* Share Resources — 2 cols, 1 row */}
            <Reveal delay={0.1} className="md:col-span-2">
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-amber-200 bg-teal-50 p-6 transition-all duration-300 hover:border-amber-300 hover:shadow-[0_0_40px_-12px_rgba(196,120,42,0.12)]">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/15 text-amber-500">
                  <Package className="size-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('landing.features.resources.title')}
                </h3>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  {t('landing.features.resources.description')}
                </p>
                <div className="mt-auto">
                  <ResourceIllustration />
                </div>
              </div>
            </Reveal>

            {/* Check In Fast — 2 cols, 1 row */}
            <Reveal delay={0.2} className="md:col-span-2">
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-teal-200 bg-teal-50 p-6 transition-all duration-300 hover:border-teal-300 hover:shadow-[0_0_40px_-12px_rgba(77,184,160,0.15)]">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                  <Shield className="size-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  {t('landing.features.checkIn.title')}
                </h3>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  {t('landing.features.checkIn.description')}
                </p>
                <div className="mt-auto flex justify-center py-2">
                  <CheckInIllustration />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  How It Works — horizontal cards                              */}
      {/* ============================================================ */}
      <section id="how-it-works" className="bg-teal-50/80 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <h2 className="mb-16 text-center text-2xl text-foreground sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
              {t('landing.howItWorks.title')}
            </h2>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { num: '1', icon: UserCheck, title: t('landing.howItWorks.step1.title'), desc: t('landing.howItWorks.step1.description'), color: 'teal' },
              { num: '2', icon: ClipboardCheck, title: t('landing.howItWorks.step2.title'), desc: t('landing.howItWorks.step2.description'), color: 'amber' },
              { num: '3', icon: Map, title: t('landing.howItWorks.step3.title'), desc: t('landing.howItWorks.step3.description'), color: 'teal' },
            ].map((step, i) => (
              <Reveal key={step.num} delay={i * 0.12}>
                <div className="relative flex flex-col items-center rounded-2xl border border-teal-200 bg-teal-50/60 px-6 pt-10 pb-8 text-center">
                  {/* Number badge */}
                  <div className={`absolute -top-5 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-lg ${
                    step.color === 'amber'
                      ? 'bg-amber-600 text-white'
                      : 'bg-teal-500 text-white'
                  }`}>
                    {step.num}
                  </div>
                  {/* Icon */}
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                    step.color === 'amber'
                      ? 'bg-amber-600/10 text-amber-500'
                      : 'bg-teal-100 text-teal-600'
                  }`}>
                    <step.icon className="size-7" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                  {/* Connector arrow (desktop, not on last) */}
                  {i < 2 && (
                    <div className="pointer-events-none absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-teal-600/30 sm:block" aria-hidden="true">
                      <ArrowRight className="size-6" />
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Community                                                    */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-teal-600 py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <svg className="absolute -bottom-16 left-1/2 h-80 w-80 -translate-x-1/2 opacity-[0.03]" viewBox="0 0 300 300"><circle cx="150" cy="150" r="150" fill="white" /></svg>
        </div>
        <div className="relative mx-auto flex max-w-2xl flex-col items-center px-4 text-center sm:px-6">
          <Reveal>
            <div className="mb-6 flex justify-center gap-1">
              {[Users, Heart, Shield].map((Icon, i) => (
                <div key={i} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white">
                  <Icon className="size-5" strokeWidth={1.5} />
                </div>
              ))}
            </div>
            <h2 className="mb-4 text-2xl text-white sm:text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
              {t('landing.community.title')}
            </h2>
            <p className="mb-10 max-w-lg leading-relaxed text-teal-50/90">
              {t('landing.community.description')}
            </p>
            <Button asChild size="lg" className="bg-amber-600 text-white hover:bg-amber-700">
              <Link to="/auth/sign-up">{t('landing.community.cta')}<ArrowRight className="ml-1 size-4" /></Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  Footer                                                       */}
      {/* ============================================================ */}
      <footer className="bg-teal-700 py-10 text-teal-100/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="" className="h-6 w-auto opacity-50" aria-hidden="true" />
            <span className="text-sm text-teal-100/80" style={{ fontFamily: 'var(--font-display)' }}>ReadyBlock</span>
          </div>
          <p className="text-xs">{t('landing.footer.credit')}</p>
          <div className="flex gap-4 text-xs">
            <Link to="/privacy" className="hover:text-teal-50">{t('landing.footer.privacy')}</Link>
            <Link to="/terms" className="hover:text-teal-50">{t('landing.footer.terms')}</Link>
            <Link to="/about" className="hover:text-teal-50">{t('landing.footer.about')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
