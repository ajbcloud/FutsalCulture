
export default function Terms() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="mx-auto w-full max-w-6xl px-6 py-6 flex items-center justify-between border-b border-gray-200">
        <a href="/" className="text-xl font-extrabold tracking-tight text-gray-900">PlayHQ</a>
        <nav className="flex items-center gap-6 text-sm">
          <a href="/" className="hover:opacity-80 text-gray-700">Home</a>
          <a href="/login" className="rounded-xl px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-900">Log in</a>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Terms and Conditions</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using PlayHQ ("Service," "Platform," "we," "us," or "our"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              PlayHQ is a comprehensive sports club management platform that provides:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Session scheduling and booking management</li>
              <li>Player and parent registration systems</li>
              <li>Payment processing and billing</li>
              <li>Communication tools for clubs and members</li>
              <li>Administrative dashboards and reporting</li>
              <li>Waitlist management and automated notifications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. User Accounts and Registration</h2>
            
            <h3 className="text-xl font-medium mb-3 text-gray-900">3.1 Account Creation</h3>
            <p className="text-gray-700 mb-4">
              To access certain features, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary.
            </p>

            <h3 className="text-xl font-medium mb-3 text-gray-900">3.2 Account Security</h3>
            <p className="text-gray-700 mb-4">
              You are responsible for safeguarding your account credentials and for all activities under your account. You must immediately notify us of any unauthorized use of your account.
            </p>

            <h3 className="text-xl font-medium mb-3 text-gray-900">3.3 Account Types</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>Club Administrators:</strong> Manage club operations, sessions, and members</li>
              <li><strong>Parents:</strong> Register children, book sessions, and manage payments</li>
              <li><strong>Players:</strong> View schedules, participate in eligible sessions (age 13+)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Subscription Plans and Billing</h2>
            
            <h3 className="text-xl font-medium mb-3 text-gray-900">4.1 Plan Types</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>Free Plan:</strong> Basic features with member limitations</li>
              <li><strong>Starter Plan:</strong> Enhanced features for growing clubs</li>
              <li><strong>Club Plan:</strong> Full-featured plan for established organizations</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 text-gray-900">4.2 Payment Terms</h3>
            <p className="text-gray-700 mb-4">
              Subscription fees are billed monthly or annually in advance. All fees are non-refundable except as required by law. We reserve the right to change pricing with 30 days' notice.
            </p>

            <h3 className="text-xl font-medium mb-3 text-gray-900">4.3 Session Fees</h3>
            <p className="text-gray-700 mb-4">
              Individual session fees are set by club administrators. Payment is required to secure session reservations. Cancellation policies vary by club and are displayed during booking.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Acceptable Use Policy</h2>
            
            <h3 className="text-xl font-medium mb-3 text-gray-900">5.1 Permitted Uses</h3>
            <p className="text-gray-700 mb-4">
              You may use PlayHQ only for lawful purposes and in accordance with these Terms. The Service is intended for sports club management and related activities.
            </p>

            <h3 className="text-xl font-medium mb-3 text-gray-900">5.2 Prohibited Activities</h3>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Violate any applicable laws or regulations</li>
              <li>Impersonate any person or entity</li>
              <li>Upload malicious code or attempt to compromise security</li>
              <li>Spam, harass, or abuse other users</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use the Service for any unauthorized commercial purpose</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Content and Intellectual Property</h2>
            
            <h3 className="text-xl font-medium mb-3 text-gray-900">6.1 Your Content</h3>
            <p className="text-gray-700 mb-4">
              You retain ownership of any content you submit to PlayHQ. By submitting content, you grant us a license to use, store, and display such content as necessary to provide the Service.
            </p>

            <h3 className="text-xl font-medium mb-3 text-gray-900">6.2 Our Intellectual Property</h3>
            <p className="text-gray-700 mb-4">
              The PlayHQ platform, including its design, features, and underlying technology, is protected by intellectual property laws. You may not copy, modify, or create derivative works without permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Privacy and Data Protection</h2>
            <p className="text-gray-700 mb-4">
              Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Safety and Liability</h2>
            
            <h3 className="text-xl font-medium mb-3 text-gray-900">8.1 Sports Participation Risks</h3>
            <p className="text-gray-700 mb-4">
              Sports activities involve inherent risks. PlayHQ is a management platform only and does not assume responsibility for injuries or incidents during sports activities. Participants and parents acknowledge these risks.
            </p>

            <h3 className="text-xl font-medium mb-3 text-gray-900">8.2 Medical Information</h3>
            <p className="text-gray-700 mb-4">
              You are responsible for providing accurate medical and emergency contact information. Club administrators may use this information in emergency situations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PLAYHQ SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to defend, indemnify, and hold harmless PlayHQ from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Service Availability</h2>
            <p className="text-gray-700 mb-4">
              We strive to maintain service availability but cannot guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue the Service with reasonable notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">12. Termination</h2>
            
            <h3 className="text-xl font-medium mb-3 text-gray-900">12.1 Termination by You</h3>
            <p className="text-gray-700 mb-4">
              You may terminate your account at any time by contacting us or using account settings. Paid subscriptions continue until the end of the billing period.
            </p>

            <h3 className="text-xl font-medium mb-3 text-gray-900">12.2 Termination by Us</h3>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account for violations of these Terms, non-payment, or other reasons with appropriate notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">13. Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              Any disputes arising from these Terms or your use of PlayHQ shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">14. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of [Your State/Country], without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">15. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or platform notifications. Continued use constitutes acceptance of modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">16. Severability</h2>
            <p className="text-gray-700 mb-4">
              If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">17. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> legal@playhq.app<br />
                <strong>Support:</strong> support@playhq.app<br />
                <strong>Address:</strong> [Your Business Address]
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">18. Entire Agreement</h2>
            <p className="text-gray-700 mb-4">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and PlayHQ regarding the use of the Service.
            </p>
          </section>
        </div>
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
