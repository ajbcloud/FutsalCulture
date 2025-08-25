import { PlanComparisonCards } from "@/components/billing/PlanComparisonCards";
import { FeatureGrid } from "@/components/billing/FeatureGrid";

export default function HomePlayHQ() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="mx-auto w-full max-w-6xl px-6 py-6 flex items-center justify-between">
        <a href="/" className="text-xl font-extrabold tracking-tight text-foreground">
          PlayHQ
        </a>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#features" className="hover:opacity-80">Features</a>
          <a href="#pricing" className="hover:opacity-80">Pricing</a>
          <a href="/login" className="rounded-xl px-4 py-2 border border-border hover:bg-accent">
            Log in
          </a>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Your club's HQ — for any sport
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Rosters, invites, payments, and schedules in one place. Soccer, futsal, basketball, volleyball—your sport, your way.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href="/get-started"
                className="inline-flex items-center justify-center rounded-2xl px-6 py-3 font-medium bg-black text-white hover:opacity-90 transition-opacity"
              >
                Get started free
              </a>
              <a href="mailto:sales@playhq.app" className="underline text-gray-700 hover:text-gray-900 py-3">
                Talk to sales
              </a>
            </div>
          </div>
          <div className="rounded-2xl shadow p-6 bg-card border border-border">
            <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 rounded-xl grid place-items-center text-gray-500 dark:text-gray-400 text-sm">
              Product screenshot
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-center text-sm text-gray-500 mb-6">Trusted by clubs worldwide</p>
          <div className="flex justify-center items-center gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-16 h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <HowItWorksStep
                number="1"
                title="Create your club"
                description="Set up your tenant and basic settings in minutes"
              />
              <HowItWorksStep
                number="2"
                title="Invite coaches, players, and parents"
                description="Send email invites or share your unique club code"
              />
              <HowItWorksStep
                number="3"
                title="Run operations"
                description="Manage schedules, payments, and rosters effortlessly"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Everything you need to run your club</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                title="Universal onboarding"
                description="Invite links and join by code make it easy for everyone to get started"
              />
              <FeatureCard
                title="Payments built-in"
                description="Start free, upgrade anytime for advanced tools and analytics"
              />
              <FeatureCard
                title="Multi-sport"
                description="Configurable for soccer, futsal, basketball, volleyball, and more"
              />
              <FeatureCard
                title="Messaging & alerts"
                description="Keep everyone informed with email and SMS notifications"
              />
              <FeatureCard
                title="Calendar & sessions"
                description="Publish once, auto-notify everyone about schedule changes"
              />
              <FeatureCard
                title="Roles & permissions"
                description="Owner, coach, parent, player roles with appropriate access"
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Simple pricing for every club</h2>
            <PlanComparisonCards currentPlan="core" isHomepage={true} />
            <div className="mt-12">
              <FeatureGrid currentPlan="core" isHomepage={true} />
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Secure by default</h2>
            <p className="text-lg text-gray-600">
              SSO options, audit logs, role-based access, and more security features to keep your club data safe.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently asked questions</h2>
            <div className="space-y-8">
              <FAQItem
                question="How quickly can I get my club set up?"
                answer="Most clubs are up and running within 15 minutes. Create your club, invite your first members, and start scheduling immediately."
              />
              <FAQItem
                question="Do you support multiple sports?"
                answer="Yes! PlayHQ works for soccer, futsal, basketball, volleyball, and many other sports. Configure team sizes, seasons, and age groups for your specific sport."
              />
              <FAQItem
                question="How does billing work?"
                answer="Start free with basic features. Upgrade anytime to unlock advanced tools, unlimited members, and priority support."
              />
              <FAQItem
                question="Can parents and players access the system?"
                answer="Absolutely. Invite parents and players with appropriate permissions. They can view schedules, make payments, and stay updated on club activities."
              />
              <FAQItem
                question="Is my data secure?"
                answer="Security is our top priority. We use enterprise-grade encryption, regular backups, and comply with data protection standards."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl px-6 py-10 text-sm text-gray-600 border-t">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div>© {currentYear} PlayHQ</div>
            <div className="flex gap-6">
              <a href="/terms" className="hover:text-gray-900">Terms</a>
              <a href="/privacy" className="hover:text-gray-900">Privacy</a>
            </div>
          </div>
          <div className="flex gap-6">
            <a href="/status" className="hover:text-gray-900">Status</a>
            <a href="mailto:support@playhq.app" className="hover:text-gray-900">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HowItWorksStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-blue-600 text-white font-bold rounded-full flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}


function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{question}</h3>
      <p className="text-gray-600 dark:text-gray-300">{answer}</p>
    </div>
  );
}