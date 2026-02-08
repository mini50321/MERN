import { X, CheckCircle, Mail } from "lucide-react";

interface JobApplicationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  employerEmail: string;
}

export default function JobApplicationSuccessModal({
  isOpen,
  onClose,
  jobTitle,
  employerEmail,
}: JobApplicationSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Application Sent</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Application Sent Successfully!
          </h3>

          <p className="text-gray-600 text-center mb-6">
            Your application for <strong className="text-gray-900">{jobTitle}</strong> has been sent to the employer.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Email Sent To:
                </p>
                <p className="text-sm text-blue-700 break-all">
                  {employerEmail}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              The employer will review your application and contact you directly if they're interested. Make sure to check your email regularly for any responses.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

