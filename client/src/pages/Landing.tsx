
import { Link } from "wouter";

export default function Landing(){
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="mx-auto w-full max-w-6xl px-6 py-6 flex items-center justify-between">
        <a href="/" className="text-xl font-extrabold tracking-tight text-gray-900">PlayHQ</a>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#features" className="hover:opacity-80 text-gray-700">Features</a>
          <a href="#pricing" className="hover:opacity-80 text-gray-700">Pricing</a>
          <a href="/login" className="rounded-xl px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-900">Log in</a>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900">Your club's HQ — for any sport</h1>
            <p className="mt-4 text-lg text-gray-600">
              Rosters, invites, payments, and schedules in one place. Soccer, futsal, basketball, volleyball—your sport, your way.
            </p>
            <div className="mt-8 flex gap-4">
              <a href="/get-started" className="inline-flex items-center rounded-2xl px-6 py-3 font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">Get started free</a>
              <a href="#pricing" className="underline text-blue-600 hover:text-blue-800">See pricing</a>
            </div>
          </div>
          <div className="rounded-2xl shadow-lg p-6 bg-white border border-gray-200">
            <div className="aspect-video w-full bg-gray-100 rounded-xl grid place-items-center text-gray-500">
              <div className="text-center">
                <div className="text-2xl font-semibold mb-2">PlayHQ Dashboard</div>
                <div className="text-sm">Manage your entire club in one place</div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-gray-50 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Everything you need to run your club</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Feature 
                title="Universal onboarding" 
                text="Owners invite coaches, players, and parents; late joiners use a secure tenant code." 
              />
              <Feature 
                title="Payments built-in" 
                text="Free to start, upgrade anytime for advanced tools and analytics." 
              />
              <Feature 
                title="Multi-sport" 
                text="Configure team sizes, seasons, and age groups for any sport." 
              />
            </div>
          </div>
        </section>

        <section id="pricing" className="py-16 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">Simple pricing</h2>
            <p className="text-center text-gray-600 mb-12">Choose the plan that fits your club</p>
            <div className="grid md:grid-cols-3 gap-8">
              <PriceCard 
                name="Free" 
                price="$0" 
                features={["Up to 50 members","Email invites","Basic calendar"]} 
              />
              <PriceCard 
                name="Starter" 
                price="$49" 
                features={["Unlimited members","CSV import","Priority support"]} 
              />
              <PriceCard 
                name="Club" 
                price="$99" 
                features={["Advanced analytics","SMS invites","Custom domains"]} 
              />
            </div>
          </div>
        </section>

        <section className="bg-gray-900 text-white py-16">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">Secure by default</h2>
            <p className="text-gray-300 text-lg">
              SSO options, audit logs, role-based access, and more security features to keep your club data safe.
            </p>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-10 text-sm text-gray-600 flex items-center justify-between border-t border-gray-200">
        <div>© {new Date().getFullYear()} PlayHQ</div>
        <div className="flex gap-6">
          <a href="/terms" className="hover:text-gray-900">Terms</a>
          <a href="/privacy" className="hover:text-gray-900">Privacy</a>
        </div>
      </footer>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }){ 
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="font-semibold text-gray-900 mb-2">{title}</div>
      <div className="text-gray-600">{text}</div>
    </div>
  ); 
}

function PriceCard({ name, price, features }: { name: string; price: string; features: string[] }){ 
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 relative">
      <div className="font-bold text-lg text-gray-900">{name}</div>
      <div className="text-4xl font-extrabold mt-2 text-gray-900">
        {price}
        <span className="text-base font-medium text-gray-600">/mo</span>
      </div>
      <ul className="mt-4 space-y-2">
        {features.map(f => (
          <li key={f} className="flex items-center gap-2 text-gray-600">
            <span className="text-green-600">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <a href="/get-started" className="inline-flex items-center justify-center w-full rounded-2xl px-6 py-3 font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          Get started
        </a>
      </div>
    </div>
  ); 
}
