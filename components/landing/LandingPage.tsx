import Link from 'next/link'
import { LandingHeroVisual } from '@/components/landing/LandingHeroVisual'
import { LandingShowcase } from '@/components/landing/LandingShowcase'


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

const landingPrimaryBtn =
  'inline-flex items-center px-8 py-[1.05rem] bg-l-ink text-l-paper text-[0.72rem] font-semibold tracking-[0.16em] uppercase border transition-[background,transform] duration-250 hover:bg-l-clay-deep hover:-translate-y-0.5'

const landingGhostBtn =
  'inline-flex items-center px-8 py-[1.05rem] border border-l-line bg-white/35 text-l-ink text-[0.72rem] font-semibold tracking-[0.14em] uppercase backdrop-blur-sm transition-[border-color,background] hover:border-l-clay hover:bg-white'

const landingLightBtn =
  'inline-flex mt-5 px-6 py-[0.85rem] bg-white text-l-ink text-[0.72rem] font-semibold tracking-[0.12em] uppercase'

const landingOutlineDarkBtn =
  'inline-flex items-center px-8 py-[1.05rem] border border-white/35 text-white bg-transparent text-[0.72rem] font-semibold tracking-[0.14em] uppercase hover:bg-white/10 hover:border-white'

export function LandingPage() {
  return (
    <div data-landing className="relative overflow-x-hidden bg-l-cream text-l-ink">
      <div
        className="pointer-events-none fixed inset-0 -z-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 95% -5%, rgba(143, 94, 68, 0.12), transparent 50%), radial-gradient(ellipse 70% 50% at -5% 95%, rgba(109, 125, 106, 0.14), transparent 45%), var(--color-l-cream)',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-[100] opacity-[0.04]"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <section className="relative z-[1] min-h-svh flex flex-col max-w-[1440px] mx-auto px-[clamp(1.25rem,4vw,3.5rem)] pt-[clamp(1rem,3vw,2rem)]">
        <div className="flex-1 grid gap-[clamp(2.5rem,6vw,4rem)] items-center pt-[clamp(2rem,5vw,4rem)] pb-12 lg:grid-cols-[1.05fr_0.95fr] lg:min-h-[calc(100svh-8rem)]">
          <div>
            <div className="flex justify-between items-baseline mb-6 gap-4">
              <span className="m-0 text-[0.65rem] font-semibold tracking-[0.32em] uppercase text-l-clay">
                Atelier
              </span>
              <span className="font-display text-[0.9rem] tracking-[0.2em] text-l-ink-soft">2026</span>
            </div>
            <h1 className="m-0 mb-6 font-display font-semibold leading-[0.92] tracking-tight">
              <span className="block text-[clamp(3rem,9vw,6.25rem)] text-l-ink">
                Place it
              </span>
              <span className="block text-[clamp(1rem,2vw,1.15rem)] font-bold tracking-[0.35em] uppercase text-l-clay mb-3 ">
                Before you <em className="italic text-l-clay">Buy it.</em>
              </span>
            </h1>
            <p className="m-0 mb-8 max-w-[26rem] text-[clamp(1.02rem,1.5vw,1.15rem)] leading-[1.75] text-l-ink-soft">
              A curated furniture marketplace where every listing lives in three dimensions —
              preview in the browser, then step into augmented reality in your own room.
            </p>
            <div className="flex flex-wrap gap-[0.65rem] mb-10">
              <Link id="link-enter-collection" href="/catalogue" className={landingPrimaryBtn}>
                Enter the collection
              </Link>
              <Link id="link-list-your-work" href="/auth/register" className={landingGhostBtn}>
                List your work
              </Link>
            </div>
          </div>
          <LandingHeroVisual />
        </div>
        <div className="flex items-center gap-3 py-6 pb-8 text-[0.65rem] font-semibold tracking-[0.25em] uppercase text-l-ink-soft" aria-hidden>
          <span>Scroll</span>
          <span className="w-12 h-px bg-l-clay animate-landing-scroll-line" />
        </div>
      </section>

      <div className="relative z-[1] border-y border-l-ink bg-l-ink text-l-paper overflow-hidden py-4" aria-hidden>
        <div className="flex w-max animate-landing-marquee">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="pr-16 text-[0.7rem] font-semibold tracking-[0.28em] uppercase whitespace-nowrap">
              Atelier Showroom · In-room AR · Gallery-grade 3D · Seller QR codes · No app required
              · True-scale placement ·
            </span>
          ))}
        </div>
      </div>

      <section className="relative z-[1] max-w-[1440px] mx-auto px-[clamp(1.25rem,4vw,3.5rem)] py-[clamp(4rem,10vw,7rem)]">
        <header className="mb-[clamp(2rem,4vw,3rem)] max-w-none flex flex-wrap justify-between items-end gap-6">
          <div className="max-w-[28rem]">
            <p className="m-0 text-[0.65rem] font-semibold tracking-[0.32em] uppercase text-l-clay">
              Curated preview
            </p>
            <h2 className="mt-2 mb-0 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-tight tracking-tight">
              Pieces that belong <em className="italic text-l-clay">in your Environment</em>
            </h2>
          </div>
          <Link
            href="/catalogue"
            className="text-[0.82rem] font-semibold tracking-wide text-l-clay underline underline-offset-[5px] whitespace-nowrap hover:text-l-ink"
          >
            View all listings →
          </Link>
        </header>
        <LandingShowcase />
      </section>

      <section className="relative z-[1] max-w-[1440px] mx-auto px-[clamp(1.25rem,4vw,3.5rem)] pb-[clamp(4rem,10vw,7rem)] grid gap-4 grid-cols-1 min-[900px]:grid-cols-12 min-[900px]:grid-rows-[auto_auto]">
        <article className="min-[900px]:col-span-7 min-[900px]:row-span-2 flex flex-col justify-end gap-[0.65rem] p-[clamp(1.75rem,3vw,2.5rem)] border border-l-line bg-gradient-to-br from-l-clay-deep from-0% via-l-ink via-55% to-l-ink text-white min-h-80">
          <p className="m-0 text-[0.65rem] font-semibold tracking-[0.32em] uppercase text-white/55">
            For buyers
          </p>
          <h2 className="m-0 font-display text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-tight max-w-[16ch]">
            Your room is the final showroom.
          </h2>
         
          <Link href="/catalogue" className={landingLightBtn}>
            Shop the catalogue
          </Link>
        </article>
        <article className="min-[900px]:col-span-5 flex flex-col justify-end gap-[0.65rem] p-[clamp(1.75rem,3vw,2.5rem)] border border-l-line bg-l-paper min-h-[220px]">
          <p className="m-0 text-[0.65rem] font-semibold tracking-[0.32em] uppercase text-l-clay">
            For sellers
          </p>
          <h3 className="m-0 font-display text-[1.65rem] font-semibold">Scan in. Model out.</h3>
          <p className="m-0 leading-relaxed text-l-ink-soft text-[0.92rem]">
            Walk around the piece in Atelier , publish your listing,
            and mint a QR for tags, Instagram, and your social media.
          </p>
          <Link
            href="/dashboard/create"
            className="text-[0.82rem] font-semibold tracking-wide text-l-clay underline underline-offset-[5px] hover:text-l-ink"
          >
            Start a listing →
          </Link>
        </article>
        <article className="min-[900px]:col-span-3 flex flex-col items-center justify-center text-center gap-[0.65rem] p-[clamp(1.75rem,3vw,2.5rem)] border border-l-line bg-l-warm min-h-[140px]">
          <span className="font-display text-[4rem] font-semibold leading-none text-l-clay opacity-35">
            AR
          </span>
          <p className="m-0 text-[0.72rem] font-semibold tracking-[0.15em] uppercase">In-browser · No install</p>
        </article>
        <article className="min-[900px]:col-span-2 flex flex-col justify-center gap-[0.65rem] p-[clamp(1.75rem,3vw,2.5rem)] border border-l-line bg-white">
          <blockquote className="m-0">
            <p className="mb-4 font-display text-[1.05rem] italic leading-snug text-l-ink">
              Fall in love with your space again — sophistication through modern, functional
              design, previewed where it actually lives.
            </p>
            <footer className="text-[0.68rem] font-semibold tracking-[0.15em] uppercase text-l-clay">
              — Atelier editorial
            </footer>
          </blockquote>
        </article>
      </section>

      <section className="relative z-[1] max-w-[1440px] mx-auto px-[clamp(1.25rem,4vw,3.5rem)] py-[clamp(4rem,10vw,7rem)]">
        <header className="mb-[clamp(2rem,4vw,3rem)] max-w-[28rem]">
          <p className="m-0 text-[0.65rem] font-semibold tracking-[0.32em] uppercase text-l-clay">
            The journey
          </p>
          <h2 className="mt-2 mb-0 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-tight tracking-tight">
            From catalogue to carpet.
          </h2>
        </header>
        <ol className="list-none m-0 p-0 grid gap-0 border-t border-l-line">
          {PROCESS.map((item) => (
            <li
              key={item.step}
              className="grid grid-cols-[auto_1fr] gap-[clamp(1.5rem,4vw,3rem)] py-[clamp(2rem,4vw,2.75rem)] border-b border-l-line items-start"
            >
              <span className="font-display text-[clamp(3rem,8vw,5rem)] font-semibold leading-none text-l-line tracking-tight">
                {item.step}
              </span>
              <div>
                <h3 className="m-0 mb-2 font-display text-[clamp(1.5rem,3vw,2rem)] font-semibold">
                  {item.title}
                </h3>
                <p className="m-0 max-w-[40rem] leading-[1.7] text-l-ink-soft text-base">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="relative z-[1] bg-l-ink text-l-paper mt-8 max-w-[70%] mx-auto">
        <div className="px-[clamp(1.25rem,4vw,3.5rem)] py-[clamp(4rem,10vw,17rem)] text-center">
          <h2 className="m-0 mb-3 font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold">
            Ready to see it in your space?
          </h2>
          <p className="mx-auto mb-8 max-w-[28rem] text-white/70">
            Join sellers building immersive listings, or explore what’s live today.
          </p>
          <div className="flex flex-wrap gap-[0.65rem] justify-center">
            <Link href="/catalogue" className={landingPrimaryBtn}>
              Explore collection
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-[1] max-w-[1440px] mx-auto px-[clamp(1.25rem,4vw,3.5rem)] pt-10 pb-12 grid gap-8 border-t border-l-line md:grid-cols-[1fr_auto] md:items-end">
        <div className="flex items-center gap-[0.85rem]">
          <span
            className="size-[1.4rem] rounded-full bg-accent-clay shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-accent-clay)_18%,transparent)]"
            aria-hidden="true"
          />
          <div>
            <span className="block font-display text-2xl font-semibold">Atelier</span>
            <span className="block text-xs tracking-widest text-l-ink-soft mt-[0.15rem]">
              AR furniture showroom
            </span>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-5 text-[0.82rem] font-semibold tracking-wide" aria-label="Footer">
          <Link href="/catalogue" className="hover:text-l-clay">
            Collection
          </Link>
          <Link href="/auth/login" className="hover:text-l-clay">
            Sign in
          </Link>
          <Link href="/dashboard" className="hover:text-l-clay">
            Dashboard
          </Link>
        </nav>
        <p className="col-span-full m-0 pt-6 border-t border-l-line text-xs text-l-ink-soft">
          © {new Date().getFullYear()} Atelier
        </p>
      </footer>
    </div>
  )
}
