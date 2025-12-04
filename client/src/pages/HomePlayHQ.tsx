import { PlanComparisonCards } from "@/components/billing/PlanComparisonCards";
import { FeatureGrid } from "@/components/billing/FeatureGrid";
import { BusinessBranding } from "@/components/business-branding";
import { BusinessProvider } from "@/contexts/BusinessContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import adminDashboardImg from "@assets/chrome_Xe6PgsfHlu_1756180663671.png";
import teamBocaLogo from "@assets/team_boca_logo_transparent_1764690655632.png";

export default function HomePlayHQ() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="mx-auto w-full max-w-6xl px-6 py-6 flex items-center justify-between">
        <a href="/" className="text-xl font-extrabold tracking-tight text-foreground">
          {/* In production, show business name/logo. In dev, show PlayHQ */}
          {import.meta.env.PROD ? (
            <BusinessProvider>
              <BusinessBranding inline variant="default" />
            </BusinessProvider>
          ) : (
            'PlayHQ'
          )}
        </a>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#features" className="hover:opacity-80">Features</a>
          <a href="#pricing" className="hover:opacity-80">Pricing</a>
          <a href="/login" className="rounded-xl px-4 py-2 border border-border hover:bg-accent">
            Log in
          </a>
          <a href="/club-signup" className="rounded-xl px-4 py-2 bg-blue-600 text-white hover:bg-blue-700">
            Sign Up
          </a>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
            {/* Text Content */}
            <div className="lg:col-span-2 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Your club's HQ — for any sport
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
                Rosters, invites, payments, and schedules in one place. Soccer, futsal, basketball, volleyball—your sport, your way.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="/club-signup"
                  className="inline-flex items-center justify-center rounded-2xl px-8 py-4 text-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Get started free
                </a>
                <a href="mailto:sales@playhq.app" className="underline text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white py-4 text-lg">
                  Talk to sales
                </a>
              </div>
            </div>
            
            {/* Dashboard Screenshot - Now Much Larger */}
            <div className="lg:col-span-3 mt-8 lg:mt-0">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
                  <img 
                    src={adminDashboardImg} 
                    alt="PlayHQ Admin Dashboard - Complete sports club management interface showing analytics, player management, and session scheduling"
                    className="w-full h-auto object-contain"
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">Trusted by sports organizations worldwide</p>
          <div className="flex justify-center items-center gap-12">
            <a 
              href="https://www.teamboca.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src={teamBocaLogo} 
                alt="Team Boca" 
                className="h-36 w-auto object-contain"
              />
            </a>
            <a 
              href="https://www.ftlrush.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src="https://lirp.cdn-website.com/5eb6b00c/dms3rep/multi/opt/Fort-Lauderdale-Rush-website-Logo.001-e18b07ca-8d99779f-1920w.png" 
                alt="Fort Lauderdale Rush" 
                className="h-24 w-auto object-contain"
              />
            </a>
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
            <PlanComparisonCards currentPlan="free" isHomepage={true} />
            <div className="mt-12">
              <FeatureGrid currentPlan="free" isHomepage={true} />
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl font-bold mb-6">Enterprise-grade security, built in</h2>
            <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
              Your players' data deserves the best protection. PlayHQ is built with security at its core—not as an afterthought.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="p-4">
                <div className="text-2xl mb-2">🔐</div>
                <h3 className="font-semibold mb-1 text-white">Role-based access</h3>
                <p className="text-sm text-gray-300">Admins, coaches, parents, and players each see only what they need</p>
              </div>
              <div className="p-4">
                <div className="text-2xl mb-2">📋</div>
                <h3 className="font-semibold mb-1 text-white">Complete audit trail</h3>
                <p className="text-sm text-gray-300">Every action is logged for transparency and accountability</p>
              </div>
              <div className="p-4">
                <div className="text-2xl mb-2">🛡️</div>
                <h3 className="font-semibold mb-1 text-white">Data encryption</h3>
                <p className="text-sm text-gray-300">SSL/TLS encryption for all data in transit and at rest</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently asked questions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="setup" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                  <AccordionTrigger className="text-left font-semibold">
                    How quickly can I get my club set up?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    Most clubs are up and running within 15 minutes. Create your club, invite your first members, and start scheduling immediately. Our setup wizard guides you through every step.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="braintree" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                  <AccordionTrigger className="text-left font-semibold">
                    How do I connect my Braintree account?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    In your Admin Settings, navigate to Integrations and select Payment Processing. Enter your Braintree Merchant ID, Public Key, and Private Key. Once connected, you can start accepting payments immediately with no additional setup required.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="pci" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                  <AccordionTrigger className="text-left font-semibold">
                    Is PlayHQ PCI compliant?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    Yes! PlayHQ is fully PCI DSS compliant. We never store credit card numbers on our servers. All payment data is processed securely through Braintree's PCI Level 1 certified infrastructure, the highest level of payment security available.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="parents" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                  <AccordionTrigger className="text-left font-semibold">
                    Can parents and players access the system?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    Absolutely. Invite parents and players with role-based permissions. Parents can view schedules, manage their children's bookings, and make payments. Players 13+ can have their own portal access with age-appropriate features.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="migration" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                  <AccordionTrigger className="text-left font-semibold">
                    Can I migrate data from my current system?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    Yes! Our Growth and Elite plans include CSV import tools to bring in your existing players, parents, and historical data. Need help with a complex migration? Our support team is here to assist.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="ages" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                  <AccordionTrigger className="text-left font-semibold">
                    Does PlayHQ support all ages?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    Absolutely! PlayHQ supports youth programs, adult leagues, and mixed-age clubs. Configure age groups, set age-appropriate permissions, and manage players from tots to seniors—all from one platform.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="processors" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                  <AccordionTrigger className="text-left font-semibold">
                    Do you support other payment processors?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    Currently, Braintree is our primary payment processor for its robust features and competitive rates. We're always expanding our integrations—submit a feature request through your dashboard and we'll prioritize based on demand.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="billing" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                  <AccordionTrigger className="text-left font-semibold">
                    How does billing and pricing work?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    Start free with up to 50 players. Upgrade anytime to Core ($99/mo), Growth ($199/mo), or Elite ($399/mo) to unlock more players, advanced features, and priority support. No long-term contracts—cancel anytime.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="security" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                  <AccordionTrigger className="text-left font-semibold">
                    Is my data secure?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    Security is built into everything we do. We use 256-bit SSL/TLS encryption for all data in transit, encrypted database storage, automated backups, and comply with GDPR and CCPA data protection standards. Your club's data is always protected.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="sports" className="border rounded-lg px-4 bg-white dark:bg-gray-800">
                  <AccordionTrigger className="text-left font-semibold">
                    Do you support multiple sports?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-300">
                    Yes! PlayHQ works for soccer, futsal, basketball, volleyball, tennis, swimming, and many other sports. Configure team sizes, session types, seasons, and age groups for your specific sport's needs.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl px-6 py-10 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div>© {currentYear} PlayHQ</div>
            <div className="flex gap-6">
              <a href="/terms" className="hover:text-gray-900 dark:hover:text-white">Terms</a>
              <a href="/privacy" className="hover:text-gray-900 dark:hover:text-white">Privacy</a>
            </div>
          </div>
          <div className="flex gap-6">
            <a href="/status" className="hover:text-gray-900 dark:hover:text-white">Status</a>
            <a href="mailto:support@playhq.app" className="hover:text-gray-900 dark:hover:text-white">Support</a>
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
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
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