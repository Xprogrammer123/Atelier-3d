import Link from 'next/link'
import { LandingHeroVisual } from '@/components/landing/LandingHeroVisual'
import { LandingShowcase } from '@/components/landing/LandingShowcase'

const STATS = [
  { value: '4', label: 'Photos to list' },
  { value: '3D', label: 'Auto-generated model' },
  { value: '0', label: 'Apps to download' },
]

const PROCESS = [
  {
    step: '01',
    title: 'Discover',
    body: 'Browse the collection or open a seller’s QR — every piece ships with an orbit preview and a direct AR link.',
  },
  {
    step: '02',
    title: 'Visualize',
    body: 'Study proportion, silhouette, and scale in 3D. On mobile, one gesture hands off to your device’s native AR viewer.',
  },
  {
    step: '03',
    title: 'Place',
    body: 'Anchor furniture on your floor, walk the room, and decide with confidence before you message the seller.',
  },
]

export function LandingPage() {
  return (
    <div className="landing">
      <div className="landing-grain" aria-hidden />

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero__grid">
          <div className="landing-hero__copy">
            <div className="landing-hero__topline">
              <span className="landing-eyebrow">Atelier · AR Showroom</span>
              <span className="landing-hero__year">2026</span>
            </div>
            <h1 className="landing-headline">
              <span className="landing-headline__pre">Place it</span>
              <span className="landing-headline__main">
                before you <em>place it.</em>
              </span>
            </h1>
            <p className="landing-lede">
              A curated furniture marketplace where every listing lives in three dimensions —
              preview in the browser, then step into augmented reality in your own room.
            </p>
            <div className="landing-hero__cta">
              <Link href="/catalogue" className="btn-landing-primary">
                Enter the collection
              </Link>
              <Link href="/auth/register" className="btn-landing-ghost">
                List your work
              </Link>
            </div>
            <dl className="landing-stats">
              {STATS.map((s) => (
                <div key={s.label} className="landing-stats__item">
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <LandingHeroVisual />
        </div>
        <div className="landing-hero__scroll" aria-hidden>
          <span>Scroll</span>
          <span className="landing-hero__scroll-line" />
        </div>
      </section>

      {/* Marquee */}
      <div className="landing-marquee" aria-hidden>
        <div className="landing-marquee__track">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i}>
              Atelier Showroom · In-room AR · Gallery-grade 3D · Seller QR codes · No app required
              · True-scale placement ·
            </span>
          ))}
        </div>
      </div>

      {/* Showcase */}
      <section className="landing-section landing-showcase-section">
        <header className="landing-section__header landing-section__header--row">
          <div>
            <p className="landing-eyebrow">Curated preview</p>
            <h2 className="landing-section__title">
              Pieces that belong <em>in situ.</em>
            </h2>
          </div>
          <Link href="/catalogue" className="landing-text-link">
            View all listings →
          </Link>
        </header>
        <LandingShowcase />
      </section>

      {/* Bento */}
      <section className="landing-bento">
        <article className="landing-bento__cell landing-bento__cell--hero">
          <p className="landing-eyebrow landing-eyebrow--light">For buyers</p>
          <h2>Your room is the final showroom.</h2>
          <p>
            model-viewer routes each device to the best AR mode — WebXR on Android with ARCore,
            Scene Viewer as fallback, AR Quick Look on iPhone.
          </p>
          <Link href="/catalogue" className="btn-landing-light">
            Shop the catalogue
          </Link>
        </article>
        <article className="landing-bento__cell landing-bento__cell--tall">
          <p className="landing-eyebrow">For sellers</p>
          <h3>Four angles in. One GLB out.</h3>
          <p>
            Front, back, left, right — our Blender pipeline builds the model, publishes your
            listing, and mints a QR for tags, Instagram, and marketplaces.
          </p>
          <Link href="/dashboard/create" className="landing-text-link">
            Start a listing →
          </Link>
        </article>
        <article className="landing-bento__cell landing-bento__cell--accent">
          <span className="landing-bento__big">AR</span>
          <p>In-browser · No install</p>
        </article>
        <article className="landing-bento__cell landing-bento__cell--quote">
          <blockquote>
            <p>
              Fall in love with your space again — sophistication through modern, functional
              design, previewed where it actually lives.
            </p>
            <footer>— Atelier editorial</footer>
          </blockquote>
        </article>
      </section>

      {/* Process */}
      <section className="landing-section landing-process">
        <header className="landing-section__header">
          <p className="landing-eyebrow">The journey</p>
          <h2 className="landing-section__title">From catalogue to carpet.</h2>
        </header>
        <ol className="landing-process__list">
          {PROCESS.map((item) => (
            <li key={item.step} className="landing-process__item">
              <span className="landing-process__step">{item.step}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA band */}
      <section className="landing-cta-band">
        <div className="landing-cta-band__inner">
          <h2>Ready to see it in your space?</h2>
          <p>Join sellers building immersive listings, or explore what’s live today.</p>
          <div className="landing-hero__cta">
            <Link href="/catalogue" className="btn-landing-primary">
              Explore collection
            </Link>
            <Link href="/auth/login" className="btn-landing-outline btn-landing-outline--on-dark">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer__brand">
          <span className="site-brand__mark" aria-hidden="true" />
          <div>
            <span className="landing-footer__name">Atelier</span>
            <span className="landing-footer__tagline">AR furniture showroom</span>
          </div>
        </div>
        <nav className="landing-footer__nav" aria-label="Footer">
          <Link href="/catalogue">Collection</Link>
          <Link href="/auth/register">Sell</Link>
          <Link href="/auth/login">Sign in</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
        <p className="landing-footer__copy">© {new Date().getFullYear()} Atelier</p>
      </footer>
    </div>
  )
}
