import { X, FileText, AlertCircle } from "lucide-react";

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  jobTitle: string;
  hasResume: boolean;
  isApplying: boolean;
}

export default function JobApplicationModal({
  isOpen,
  onClose,
  onConfirm,
  jobTitle,
  hasResume,
  isApplying,
}: JobApplicationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Confirm Application</h2>
          <button
            onClick={onClose}
            disabled={isApplying}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to apply for <strong>{jobTitle}</strong>?
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700">
              Your application will include:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>• Name and contact information</li>
              <li>• Professional bio and experience</li>
              <li>• Education details</li>
              <li>• Location information</li>
            </ul>
          </div>

          {hasResume ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start gap-3">
              <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900 mb-1">
                  Resume Found
                </p>
                <p className="text-sm text-green-700">
                  Your resume from your profile will be attached to this application.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  No Resume Uploaded
                </p>
                <p className="text-sm text-amber-700">
                  You can upload your resume in the Edit Profile section for future applications.
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 mb-6">
            Your application will be sent via email to the employer.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isApplying}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isApplying}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplying ? "Sending..." : "Confirm & Apply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
