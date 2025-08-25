
```tsx
import CTA from "../shared/CTA"; // optional
import SocialButtons from "../components/SocialButtons"; // optional

export default function Landing(){
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="mx-auto w-full max-w-6xl px-6 py-6 flex items-center justify-between">
        <a href="/" className="text-xl font-extrabold tracking-tight">PlayHQ</a>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#features" className="hover:opacity-80">Features</a>
          <a href="#pricing" className="hover:opacity-80">Pricing</a>
          <a href="/login" className="rounded-xl px-4 py-2 border hover:bg-gray-50">Log in</a>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Your club’s HQ — for any sport</h1>
            <p className="mt-4 text-lg text-gray-600">Rosters, invites, payments, and schedules in one place.</p>
            <div className="mt-8 flex gap-4">
              <a href="/get-started" className="inline-flex items-center rounded-2xl px-6 py-3 font-medium bg-black text-white hover:opacity-90">Get started free</a>
              <a href="#pricing" className="underline">See pricing</a>
            </div>
            <div className="mt-8 hidden md:block">
              {/* Show SSO shortcuts from the landing too (optional) */}
              <SocialButtons />
            </div>
          </div>
          <div className="rounded-2xl shadow p-6 bg-white border">
            {/* Replace with a product screenshot/carousel */}
            <div className="aspect-video w-full bg-gray-100 rounded-xl grid place-items-center text-gray-500">Product screenshot</div>
          </div>
        </section>

        <section id="features" className="bg-gray-50 py-16">
          <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-3 gap-8">
            <Feature title="Universal onboarding" text="Owners invite coaches, players, and parents." />
            <Feature title="Payments built‑in" text="Free to start, upgrade anytime for advanced tools." />
            <Feature title="Multi‑sport" text="Configure team sizes, seasons, and age groups for any sport." />
          </div>
        </section>

        <section id="pricing" className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-bold mb-6">Simple pricing</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <PriceCard name="Free" price="$0" features={["Up to 50 members", "Email invites"]} />
              <PriceCard name="Starter" price="$49" features={["Unlimited members", "CSV import"]} />
              <PriceCard name="Club" price="$99" features={["Advanced analytics", "SMS invites"]} />
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-10 text-sm text-gray-600 flex items-center justify-between">
        <div>© {new Date().getFullYear()} PlayHQ</div>
        <div className="flex gap-6"><a href="/terms">Terms</a><a href="/privacy">Privacy</a></div>
      </footer>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }){ return (
  <div className="p-6 bg-white rounded-2xl shadow border">
    <div className="font-semibold">{title}</div>
    <div className="text-gray-600 mt-2">{text}</div>
  </div>
); }

function PriceCard({ name, price, features }: { name: string; price: string; features: string[] }){ return (
  <div className="p-6 bg-white rounded-2xl shadow border">
    <div className="font-bold text-lg">{name}</div>
    <div className="text-4xl font-extrabold mt-2">{price}<span className="text-base font-medium">/mo</span></div>
    <ul className="mt-4 space-y-2">{features.map(f => (<li key={f} className="flex items-center gap-2"><span>•</span><span>{f}</span></li>))}</ul>
    <div className="mt-6"><a href="/get-started" className="inline-flex items-center rounded-2xl px-6 py-3 font-medium bg-black text-white hover:opacity-90">Get started</a></div>
  </div>
); }
```
