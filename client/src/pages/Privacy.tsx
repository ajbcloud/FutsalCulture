
export default function Privacy() {
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
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to PlayHQ ("we," "our," or "us"). We are committed to protecting your privacy and handling your personal information responsibly. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our sports club management platform and related services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3 text-gray-900">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Account information (name, email address, phone number)</li>
              <li>Profile information for players and parents</li>
              <li>Payment information and billing details</li>
              <li>Emergency contact information</li>
              <li>Medical information relevant to sports participation</li>
              <li>Communication preferences</li>
              <li>Support requests and feedback</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 text-gray-900">2.2 Information Collected Automatically</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>Location data (when explicitly permitted)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 text-gray-900">2.3 Information from Third Parties</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Social media login information (when you choose to connect accounts)</li>
              <li>Payment processor information</li>
              <li>Analytics and advertising partners</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Provide and maintain our sports club management services</li>
              <li>Process registrations, payments, and session bookings</li>
              <li>Communicate about sessions, schedules, and important updates</li>
              <li>Ensure safety and emergency preparedness</li>
              <li>Improve our platform and develop new features</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Comply with legal obligations and protect our rights</li>
              <li>Send marketing communications (with your consent)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-medium mb-3 text-gray-900">We may share your information with:</h3>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>Sports club administrators:</strong> To manage registrations and communications</li>
              <li><strong>Payment processors:</strong> To handle transactions securely</li>
              <li><strong>Service providers:</strong> Who help us operate our platform</li>
              <li><strong>Emergency contacts:</strong> When necessary for safety purposes</li>
              <li><strong>Legal authorities:</strong> When required by law or to protect rights</li>
            </ul>

            <p className="text-gray-700 mb-4">
              We do not sell your personal information to third parties for marketing purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication requirements</li>
              <li>Employee training on data protection practices</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Your Rights and Choices</h2>
            <p className="text-gray-700 mb-4">
              Depending on your location, you may have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Access and portability of your personal data</li>
              <li>Correction of inaccurate or incomplete information</li>
              <li>Deletion of your personal information</li>
              <li>Restriction of processing in certain circumstances</li>
              <li>Objection to processing for marketing purposes</li>
              <li>Withdrawal of consent where processing is based on consent</li>
            </ul>
            <p className="text-gray-700 mb-4">
              To exercise these rights, please contact us at privacy@playhq.app.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our platform is designed for sports clubs that may serve minors. We take special care to protect children's privacy:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Parental consent is required for children under 13</li>
              <li>We collect only information necessary for sports participation</li>
              <li>Parents can review and request deletion of their child's information</li>
              <li>We do not knowingly collect personal information from children without parental consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Cookies and Tracking</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar technologies to enhance your experience. You can control cookie settings through your browser preferences. Essential cookies necessary for platform functionality cannot be disabled.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information during international transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations. When information is no longer needed, we securely delete or anonymize it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of material changes by email or through our platform. Your continued use of our services after changes take effect constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">12. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@playhq.app<br />
                <strong>Support:</strong> support@playhq.app<br />
                <strong>Address:</strong> [Your Business Address]
              </p>
            </div>
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
