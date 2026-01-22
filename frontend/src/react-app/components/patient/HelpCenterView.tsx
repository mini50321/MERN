import { ArrowLeft, HelpCircle, MessageCircle, Phone, Mail } from "lucide-react";
import { useState } from "react";

interface HelpCenterViewProps {
  onBack: () => void;
}

export default function HelpCenterView({ onBack }: HelpCenterViewProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I book a service?",
      answer: "Go to the Services tab, select the service you need, choose the type of service, fill in your details and requirements, and submit. A professional will review your request and send you a quote."
    },
    {
      question: "How long does it take to get a response?",
      answer: "Most service requests receive a response within 24 hours. For urgent cases, professionals typically respond within a few hours."
    },
    {
      question: "Can I cancel or modify my booking?",
      answer: "Yes, you can decline quotes before accepting them. Once accepted, please contact the service provider directly through the contact information provided."
    },
    {
      question: "How do payments work?",
      answer: "After you accept a quote, you'll need to make payment as per the agreed terms with the service provider. Transaction history can be viewed in the Settings tab."
    },
    {
      question: "How do I rate a service?",
      answer: "After a service is marked as completed, you'll see an option to rate and review the service in your My Bookings tab."
    },
    {
      question: "Is my information secure?",
      answer: "Yes, we take data security seriously. All your personal information is encrypted and stored securely. We never share your data with third parties without your consent."
    },
    {
      question: "What services are available?",
      answer: "We offer Biomedical Engineering services, Nursing, Physiotherapy, Ambulance services, and Equipment Rental. More services like Pharmacy, Labs, and Doctor Consultations are coming soon."
    },
    {
      question: "How do I update my profile?",
      answer: "Click on your profile icon in the top right corner to access your profile settings. You can update your contact information, address, and location from there."
    }
  ];

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
          <h2 className="text-2xl font-bold text-gray-900">Help Center</h2>
          <p className="text-sm text-gray-600">Get help and support for using Mavy App</p>
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-6 h-6" />
          <h3 className="text-lg font-bold">Need More Help?</h3>
        </div>
        <p className="mb-4 text-teal-50">Our support team is here to assist you with any questions or issues.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="mailto:mavytechsolutions@gmail.com"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-4 py-3 transition-colors"
          >
            <Mail className="w-5 h-5" />
            <div>
              <p className="text-xs text-teal-100">Email Support</p>
              <p className="font-semibold">mavytechsolutions@gmail.com</p>
            </div>
          </a>
          <a
            href="tel:+919876543210"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-4 py-3 transition-colors"
          >
            <Phone className="w-5 h-5" />
            <div>
              <p className="text-xs text-teal-100">Phone Support</p>
              <p className="font-semibold">+91 98765 43210</p>
            </div>
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-4">
          <HelpCircle className="w-6 h-6 text-teal-600" />
          <h3 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <span className="text-teal-600 font-bold text-xl">
                  {expandedFaq === index ? "−" : "+"}
                </span>
              </button>
              {expandedFaq === index && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
