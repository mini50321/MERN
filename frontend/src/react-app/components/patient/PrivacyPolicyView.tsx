import { ArrowLeft, Shield } from "lucide-react";

interface PrivacyPolicyViewProps {
  onBack: () => void;
}

export default function PrivacyPolicyView({ onBack }: PrivacyPolicyViewProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Privacy Policy</h2>
          <p className="text-sm text-gray-600">Last updated: January 2025</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <div className="prose prose-teal max-w-none">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <Shield className="w-6 h-6 text-teal-600" />
            <h3 className="text-xl font-bold text-gray-900 m-0">Your Privacy Matters</h3>
          </div>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">1. Information We Collect</h4>
            <p className="text-gray-700 leading-relaxed mb-2">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Name, email address, and phone number</li>
              <li>Address and location information</li>
              <li>Service requests and booking details</li>
              <li>Payment information (processed securely)</li>
              <li>Ratings and reviews</li>
              <li>Communication with service providers</li>
            </ul>
          </section>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Your Information</h4>
            <p className="text-gray-700 leading-relaxed mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Connect you with appropriate healthcare service providers</li>
              <li>Process your service requests and bookings</li>
              <li>Send notifications about booking status and updates</li>
              <li>Improve our platform and services</li>
              <li>Provide customer support</li>
              <li>Prevent fraud and ensure platform security</li>
            </ul>
          </section>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">3. Information Sharing</h4>
            <p className="text-gray-700 leading-relaxed">
              We share your information only with service providers necessary to fulfill your service requests. We do not sell your personal information to third parties. Your information may be shared with:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mt-2">
              <li>Service providers you book (name, contact, location, service requirements)</li>
              <li>Payment processors (for transaction processing)</li>
              <li>Service partners (for platform functionality)</li>
            </ul>
          </section>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">4. Data Security</h4>
            <p className="text-gray-700 leading-relaxed">
              We implement industry-standard security measures to protect your personal information. This includes encryption of sensitive data, secure data storage, regular security audits, and restricted access to personal information. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">5. Data Retention</h4>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and data at any time by contacting our support team.
            </p>
          </section>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">6. Your Rights</h4>
            <p className="text-gray-700 leading-relaxed mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">7. Cookies and Tracking</h4>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar tracking technologies to improve user experience, analyze platform usage, and personalize content. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">8. Children's Privacy</h4>
            <p className="text-gray-700 leading-relaxed">
              Our services are not intended for children under 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">9. Changes to Privacy Policy</h4>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or platform notification. Continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">10. Contact Us</h4>
            <p className="text-gray-700 leading-relaxed">
              If you have questions or concerns about this Privacy Policy or how we handle your data, please contact us:
            </p>
            <p className="text-teal-600 font-semibold mt-2">
              Email: mavytechsolutions@gmail.com<br />
              Phone: +91 98765 43210
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
