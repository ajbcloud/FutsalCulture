import { Link } from "wouter";
import { ArrowRight, Check, Users, Calendar, CreditCard, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <header className="mx-auto w-full max-w-7xl px-6 py-6 flex items-center justify-between">
        <a href="/" className="text-2xl font-black tracking-tight text-white" data-testid="link-home">
          SkoreHQ
        </a>
        <nav className="flex items-center gap-8 text-sm">
          <a href="#features" className="text-gray-400 hover:text-[#BFFF00] transition-colors" data-testid="link-features">Features</a>
          <a href="#pricing" className="text-gray-400 hover:text-[#BFFF00] transition-colors" data-testid="link-pricing">Pricing</a>
          <a href="/login" className="px-5 py-2.5 border border-[#333] text-white hover:border-[#BFFF00] hover:text-[#BFFF00] transition-colors rounded-lg font-medium" data-testid="link-login">
            Log in
          </a>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -left-4 top-0 w-2 h-32 bg-[#BFFF00]"></div>
              <h1 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tight">
                YOUR CLUB'S
                <br />
                <span className="text-[#BFFF00]">HQ</span>
                <br />
                <span className="text-gray-500">FOR ANY SPORT</span>
              </h1>
              <p className="mt-8 text-lg text-gray-400 max-w-md">
                Rosters, invites, payments, and schedules in one place. Soccer, futsal, basketball, volleyball—your sport, your way.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <a
                  href="/get-started"
                  className="inline-flex items-center gap-2 bg-[#BFFF00] text-black px-8 py-4 font-bold rounded-lg hover:bg-[#d4ff33] transition-colors"
                  data-testid="button-get-started"
                >
                  Get started free
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 border border-[#BFFF00] text-[#BFFF00] px-8 py-4 font-bold rounded-lg hover:bg-[#BFFF00] hover:text-black transition-colors"
                  data-testid="button-see-pricing"
                >
                  See pricing
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#BFFF00] opacity-20 blur-3xl"></div>
              <div className="relative bg-[#242424] border border-[#333] rounded-xl p-8">
                <div className="absolute -top-6 -left-6 bg-[#BFFF00] px-4 py-2 text-black font-bold text-sm">
                  DASHBOARD
                </div>
                <div className="aspect-video w-full bg-[#1a1a1a] rounded-lg flex items-center justify-center border border-[#333]">
                  <div className="text-center">
                    <div className="text-4xl font-black text-white mb-2">SkoreHQ</div>
                    <div className="text-sm text-gray-500">Manage your entire club</div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-lg text-center">
                    <div className="text-2xl font-black text-[#BFFF00]">128</div>
                    <div className="text-xs text-gray-500 mt-1">Players</div>
                  </div>
                  <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-lg text-center">
                    <div className="text-2xl font-black text-white">12</div>
                    <div className="text-xs text-gray-500 mt-1">Teams</div>
                  </div>
                  <div className="bg-[#1a1a1a] border border-[#333] p-4 rounded-lg text-center">
                    <div className="text-2xl font-black text-white">98%</div>
                    <div className="text-xs text-gray-500 mt-1">Attendance</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-[#1a1a1a] py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-white">
                EVERYTHING YOU NEED
              </h2>
              <p className="mt-4 text-gray-400 text-lg">To run your club like a pro</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                number="01"
                icon={<Users className="w-8 h-8" />}
                title="Universal Onboarding"
                description="Owners invite coaches, players, and parents; late joiners use a secure tenant code."
              />
              <FeatureCard
                number="02"
                icon={<CreditCard className="w-8 h-8" />}
                title="Payments Built-in"
                description="Free to start, upgrade anytime for advanced tools and analytics."
              />
              <FeatureCard
                number="03"
                icon={<Calendar className="w-8 h-8" />}
                title="Multi-Sport Ready"
                description="Configure team sizes, seasons, and age groups for any sport."
              />
            </div>

            <div className="mt-16 text-center">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 text-[#BFFF00] font-bold hover:gap-4 transition-all"
                data-testid="link-see-more"
              >
                See more features
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>

        <section className="py-24 bg-[#242424]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="text-[180px] font-black text-[#BFFF00] opacity-10 absolute -top-20 -left-8 leading-none">
                  04
                </div>
                <div className="relative z-10">
                  <h3 className="text-3xl md:text-4xl font-black text-white">
                    SECURE BY DEFAULT
                  </h3>
                  <p className="mt-6 text-gray-400 text-lg">
                    SSO options, audit logs, role-based access, and more security features to keep your club data safe.
                  </p>
                  <ul className="mt-8 space-y-4">
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[#BFFF00]" />
                      Single Sign-On (SSO)
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[#BFFF00]" />
                      Role-based access control
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[#BFFF00]" />
                      Complete audit logs
                    </li>
                    <li className="flex items-center gap-3 text-gray-300">
                      <Check className="w-5 h-5 text-[#BFFF00]" />
                      Data encryption at rest
                    </li>
                  </ul>
                </div>
              </div>
              <div className="relative">
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-[#BFFF00] rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Analytics Dashboard</div>
                      <div className="text-sm text-gray-500">Real-time insights</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-[#333] rounded-full overflow-hidden">
                      <div className="h-full bg-[#BFFF00] rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <div className="h-4 bg-[#333] rounded-full overflow-hidden">
                      <div className="h-full bg-[#BFFF00] rounded-full" style={{ width: '72%' }}></div>
                    </div>
                    <div className="h-4 bg-[#333] rounded-full overflow-hidden">
                      <div className="h-full bg-[#BFFF00] rounded-full" style={{ width: '93%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-24 bg-[#1a1a1a]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-white">SIMPLE PRICING</h2>
              <p className="mt-4 text-gray-400 text-lg">Choose the plan that fits your club</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <PriceCard
                name="Free"
                price="$0"
                features={["Up to 10 players", "Manual sessions", "Basic support"]}
              />
              <PriceCard
                name="Core"
                price="$79"
                features={["Unlimited players", "Recurring sessions", "Email notifications"]}
              />
              <PriceCard
                name="Growth"
                price="$149"
                features={["Unlimited players", "SMS notifications", "Advanced analytics"]}
                popular={true}
              />
              <PriceCard
                name="Elite"
                price="$299"
                features={["Unlimited players", "White-label branding", "Priority support"]}
              />
            </div>
          </div>
        </section>

        <section className="py-24 bg-[#BFFF00]">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-black">
              READY TO GET STARTED?
            </h2>
            <p className="mt-4 text-black/70 text-lg max-w-2xl mx-auto">
              Join thousands of clubs already managing their teams with SkoreHQ
            </p>
            <div className="mt-10">
              <a
                href="/get-started"
                className="inline-flex items-center gap-2 bg-black text-white px-10 py-5 font-bold rounded-lg hover:bg-gray-900 transition-colors text-lg"
                data-testid="button-cta-bottom"
              >
                Start for free
                <ArrowRight className="w-6 h-6" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#1a1a1a] border-t border-[#333]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-2xl font-black text-white">SkoreHQ</div>
            <div className="flex gap-8 text-sm text-gray-400">
              <a href="/terms" className="hover:text-[#BFFF00] transition-colors" data-testid="link-terms">Terms</a>
              <a href="/privacy" className="hover:text-[#BFFF00] transition-colors" data-testid="link-privacy">Privacy</a>
              <a href="/contact" className="hover:text-[#BFFF00] transition-colors" data-testid="link-contact">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[#333] text-center text-sm text-gray-500">
            © {new Date().getFullYear()} SkoreHQ. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: JSX.Element;
  title: string;
  description: string;
}) {
  return (
    <div className="relative bg-[#242424] border border-[#333] rounded-xl p-8 group hover:border-[#BFFF00] transition-colors">
      <div className="absolute -top-6 -right-4 text-6xl font-black text-[#BFFF00] opacity-20 group-hover:opacity-40 transition-opacity">
        {number}
      </div>
      <div className="relative z-10">
        <div className="w-14 h-14 bg-[#BFFF00] rounded-lg flex items-center justify-center text-black mb-6">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>
  );
}

function PriceCard({
  name,
  price,
  features,
  popular = false,
}: {
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
}) {
  return (
    <div
      className={`relative bg-[#242424] rounded-xl p-8 ${
        popular ? "border-2 border-[#BFFF00] ring-4 ring-[#BFFF00]/20" : "border border-[#333]"
      }`}
      data-testid={`card-pricing-${name.toLowerCase()}`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-[#BFFF00] text-black text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
            Most Popular
          </span>
        </div>
      )}
      <div className="font-bold text-lg text-white">{name}</div>
      <div className="mt-4">
        <span className="text-5xl font-black text-white">{price}</span>
        <span className="text-gray-500 ml-1">/mo</span>
      </div>
      <ul className="mt-8 space-y-4">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-3 text-gray-300">
            <Check className="w-5 h-5 text-[#BFFF00] flex-shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <a
          href="/get-started"
          className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 font-bold rounded-lg transition-colors ${
            popular
              ? "bg-[#BFFF00] text-black hover:bg-[#d4ff33]"
              : "bg-[#333] text-white hover:bg-[#444]"
          }`}
          data-testid={`button-get-started-${name.toLowerCase()}`}
        >
          Get started
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
