import Link from 'next/link'
import { LandingHeroVisual } from '@/components/landing/LandingHeroVisual'

const STEPS = [
  {
    num: '01',
    title: 'Browse or scan',
    text: 'Explore the catalogue or open a seller’s QR code — no app install.',
  },
  {
    num: '02',
    title: 'Preview in 3D',
    text: 'Orbit every piece at true scale before you commit to a purchase.',
  },
  {
    num: '03',
    title: 'Place in your room',
    text: 'Tap Try in AR. WebXR, Scene Viewer, or Quick Look — your phone picks the best mode.',
  },
]

export function LandingPage() {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero__copy">
          <p className="landing-eyebrow">AR Furniture · Showroom 2026</p>
          <h1 className="landing-headline">
            <span className="landing-headline__line">Fall in love</span>
            <span className="landing-headline__line landing-headline__line--accent">
              with your space
            </span>
            <span className="landing-headline__line">before you buy.</span>
          </h1>
          <p className="landing-lede">
            FurnishAR brings gallery-grade furniture shopping to your browser — immersive 3D
            previews and in-room AR for buyers, photogrammetry-powered listings for sellers.
          </p>
          <div className="landing-hero__cta">
            <Link href="/catalogue" className="btn-landing-primary">
              Explore collection
            </Link>
            <Link href="/auth/register" className="btn-landing-outline">
              Start selling
            </Link>
          </div>
        </div>
        <LandingHeroVisual />
      </section>

      {/* Marquee */}
      <div className="landing-marquee" aria-hidden>
        <div className="landing-marquee__track">
          <span>WebXR · Scene Viewer · AR Quick Look</span>
          <span>No app download</span>
          <span>True-scale placement</span>
          <span>Seller QR codes</span>
          <span>Blender 3D pipeline</span>
          <span>WebXR · Scene Viewer · AR Quick Look</span>
          <span>No app download</span>
          <span>True-scale placement</span>
        </div>
      </div>

      {/* How it works */}
      <section className="landing-section landing-steps">
        <div className="landing-section__head">
          <p className="landing-eyebrow">The experience</p>
          <h2 className="landing-section__title">From photo to placement</h2>
        </div>
        <div className="landing-steps__grid">
          {STEPS.map((step) => (
            <article key={step.num} className="landing-step-card">
              <span className="landing-step-card__num">{step.num}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Split features */}
      <section className="landing-section landing-split">
        <article className="landing-panel landing-panel--buyer">
          <p className="landing-eyebrow">For buyers</p>
          <h2>See it in your room</h2>
          <p>
            Interactive orbit previews on every product. One tap launches AR on Android and
            iPhone — we handle ARCore, Scene Viewer, and Quick Look automatically.
          </p>
          <Link href="/catalogue" className="landing-panel__link">
            Browse catalogue →
          </Link>
        </article>
        <article className="landing-panel landing-panel--seller">
          <p className="landing-eyebrow">For sellers</p>
          <h2>List with four photos</h2>
          <p>
            Upload front, back, left, and right views. Our Blender pipeline builds a GLB,
            publishes your listing, and generates a shareable QR for tags and social.
          </p>
          <Link href="/dashboard/create" className="landing-panel__link">
            Create a listing →
          </Link>
        </article>
      </section>

      {/* AR band */}
      <section className="landing-ar-band">
        <div className="landing-ar-band__inner">
          <div>
            <p className="landing-eyebrow landing-eyebrow--light">In-browser AR</p>
            <h2>Your room is the showroom</h2>
            <p>
              Reticle, scale, and floor placement — powered by Google model-viewer so buyers on
              almost any phone get a native-quality experience without installing an app.
            </p>
          </div>
          <div className="landing-ar-band__devices">
            <div className="landing-device-pill">Android · WebXR</div>
            <div className="landing-device-pill">Android · Scene Viewer</div>
            <div className="landing-device-pill">iOS · Quick Look</div>
            <div className="landing-device-pill">Desktop · 3D orbit</div>
          </div>
        </div>
      </section>

      {/* Editorial quote */}
      <section className="landing-quote">
        <blockquote>
          <p>
            “Sophistication through modern, functional design — previewed in the environment
            where it actually lives.”
          </p>
        </blockquote>
      </section>

      {/* Final CTA */}
      <section className="landing-cta-final">
        <h2>Ready to furnish with confidence?</h2>
        <p>Join as a seller or explore pieces already live in the catalogue.</p>
        <div className="landing-hero__cta">
          <Link href="/catalogue" className="btn-landing-primary">
            Shop now
          </Link>
          <Link href="/auth/register" className="btn-landing-outline btn-landing-outline--dark">
            Register free
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span className="site-brand__mark" aria-hidden="true" />
        <span>FurnishAR</span>
        <nav aria-label="Footer">
          <Link href="/catalogue">Shop</Link>
          <Link href="/auth/login">Log in</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </footer>
    </div>
  )
}
