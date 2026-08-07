import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About NammaTamil | நம்ம Tamil",
  description: "About NammaTamil — how we curate Tamil Nadu and global Tamil news, cinema and trending stories for the Tamil community worldwide.",
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-sm leading-relaxed">
      <h1 className="text-3xl font-bold mb-6">About NammaTamil</h1>

      <section className="mb-8">
        <p className="text-base leading-7">
          நம்ம Tamil (NammaTamil) is a free news hub built for Tamil readers everywhere — in Tamil Nadu,
          across India, and in the wider Tamil diaspora. We track politics, cinema, sports and everyday
          life in Tamil Nadu and pull it into one place, updated every ten minutes.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">What We Cover</h2>
        <p>
          Our homepage refreshes automatically with the latest Tamil-language headlines from established
          news outlets — politics and governance from Tamil Nadu and the Union government, Kollywood
          cinema news and release updates, cricket and IPL coverage, and technology stories relevant to
          Tamil readers. Every headline links back to the original publisher so you can read the full
          story at the source.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">How We Curate</h2>
        <p>
          NammaTamil is an automated aggregator, not a newsroom — we do not employ reporters and we do
          not claim authorship of the articles we link to. What we add is curation: pulling multiple
          Tamil news feeds into a single, fast-loading, mobile-friendly page, refreshed on a fixed
          schedule, so you don&apos;t have to check five different sites to keep up with Tamil Nadu.
          Copyright for every linked article remains with its original publisher.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Travel Guides</h2>
        <p>
          Alongside news, we publish original local guides for Tamil Nadu travel — temple tour
          itineraries, hill station and pilgrimage guides — written for readers planning a trip, with an
          AI-assisted day-by-day planner you can generate for free. See{" "}
          <a href="/tamil-nadu-temple-tour" className="underline">Tamil Nadu Temple Tour</a> and{" "}
          <a href="/places-to-visit-in-tamil-nadu" className="underline">Places to Visit in Tamil Nadu</a>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Privacy First</h2>
        <p>
          We collect only the data necessary to provide the service. We do not sell your data to third
          parties. See our{" "}
          <a href="/privacy" className="underline">Privacy Policy</a> for full details.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Advertising</h2>
        <p>
          NammaTamil is supported by advertising through Google AdSense. Ads help us keep the service
          free for everyone. We work to ensure ads are relevant and non-intrusive.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Get in Touch</h2>
        <p>
          Spotted an outdated headline, a broken link, or want a publisher removed from our feed? We&apos;d
          love to hear from you. Reach us at{" "}
          <a href="mailto:info.siva@gmail.com" className="underline">info.siva@gmail.com</a> or use our{" "}
          <a href="/contact" className="underline">contact page</a>.
        </p>
      </section>

      <p className="mt-10 opacity-40 text-xs">© 2026 NammaTamil. All rights reserved.</p>
    </main>
  );
}
