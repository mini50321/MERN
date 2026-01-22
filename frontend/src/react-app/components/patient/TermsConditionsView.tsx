import { ArrowLeft, FileText } from "lucide-react";

interface TermsConditionsViewProps {
  onBack: () => void;
}

export default function TermsConditionsView({ onBack }: TermsConditionsViewProps) {
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
          <h2 className="text-2xl font-bold text-gray-900">Terms & Conditions</h2>
          <p className="text-sm text-gray-600">Last updated: January 2025</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <div className="prose prose-teal max-w-none">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <FileText className="w-6 h-6 text-teal-600" />
            <h3 className="text-xl font-bold text-gray-900 m-0">Terms of Service</h3>
          </div>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h4>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using the Mavy App platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">2. Service Description</h4>
            <p className="text-gray-700 leading-relaxed mb-2">
              Mavy App is a platform that connects patients with healthcare professionals including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Biomedical Engineers for equipment repair and maintenance</li>
              <li>Nursing professionals for home care services</li>
              <li>Physiotherapists for rehabilitation services</li>
              <li>Ambulance services for medical transportation</li>
              <li>Medical equipment rental services</li>
            </ul>
          </section>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">3. User Responsibilities</h4>
            <p className="text-gray-700 leading-relaxed mb-2">As a user of Mavy App, you agree to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Provide accurate and truthful information in your profile and service requests</li>
              <li>Keep your account credentials secure and confidential</li>
              <li>Use the platform only for lawful purposes</li>
              <li>Respect the privacy and rights of service providers</li>
              <li>Make payments as agreed upon with service providers</li>
            </ul>
          </section>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">4. Booking and Payments</h4>
            <p className="text-gray-700 leading-relaxed">
              Service bookings are subject to availability and acceptance by the service provider. Payment terms are agreed upon between you and the service provider. Mavy App facilitates the connection but is not responsible for payment disputes.
            </p>
          </section>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">5. Cancellation Policy</h4>
            <p className="text-gray-700 leading-relaxed">
              You may decline service quotes before accepting them. After acceptance, cancellation terms should be discussed directly with the service provider. Refund policies vary by service provider.
            </p>
          </section>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">6. Limitation of Liability</h4>
            <p className="text-gray-700 leading-relaxed">
              Mavy App acts as a platform connecting patients with service providers. We do not provide medical services directly. We are not liable for the quality of services provided, medical outcomes, or any disputes between users and service providers.
            </p>
          </section>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">7. Privacy and Data Protection</h4>
            <p className="text-gray-700 leading-relaxed">
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information.
            </p>
          </section>

          <section className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">8. Modifications to Terms</h4>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Continued use of the platform constitutes acceptance of modified terms.
            </p>
          </section>

          <section>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">9. Contact Information</h4>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms and Conditions, please contact us at:
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
