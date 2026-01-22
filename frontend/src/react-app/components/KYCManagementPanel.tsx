import { useState } from "react";
import { CheckCircle, XCircle, Eye, X, FileText, AlertCircle } from "lucide-react";

interface KYCSubmission {
  id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  full_name: string;
  id_proof_url: string;
  pan_card_url: string;
  experience_certificate_url: string;
  status: string;
  rejection_reason: string;
  submitted_at: string;
  reviewed_at: string;
}

export default function KYCManagementPanel({
  submissions,
  onReload,
  canEdit,
}: {
  submissions: KYCSubmission[];
  onReload: () => void;
  canEdit: boolean;
}) {
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async (id: number) => {
    if (!canEdit || !confirm("Are you sure you want to approve this KYC submission?")) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/kyc/${id}/approve`, {
        method: "PUT",
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ KYC Approved Successfully!\n\nThe partner can now access the Earn section and receive service requests.");
        setShowReviewModal(false);
        setTimeout(() => {
          onReload();
        }, 100);
      } else {
        console.error("KYC approval failed:", data);
        alert(`Failed to approve KYC: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error approving KYC:", error);
      alert(`An error occurred while approving KYC: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: number) => {
    if (!canEdit || !rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    if (!confirm("Are you sure you want to reject this KYC submission?")) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/kyc/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("❌ KYC Rejected\n\nThe partner has been notified and can resubmit with corrected documents.");
        setShowReviewModal(false);
        setRejectionReason("");
        setTimeout(() => {
          onReload();
        }, 100);
      } else {
        console.error("KYC rejection failed:", data);
        alert(`Failed to reject KYC: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error rejecting KYC:", error);
      alert(`An error occurred while rejecting KYC: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Pending Review
          </span>
        );
      case "approved":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return <span className="text-gray-500 text-sm">{status}</span>;
    }
  };

  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Total Submissions: <span className="font-semibold text-gray-900">{submissions.length}</span>
          {pendingCount > 0 && (
            <span className="ml-3 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              {pendingCount} Pending
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Partner Name</th>
              <th className="text-left py-3 px-4">Name on Documents</th>
              <th className="text-left py-3 px-4">Contact</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Submitted</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{submission.user_name || "N/A"}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-blue-900">{submission.full_name || "Not provided"}</div>
                  <div className="text-xs text-gray-500">As per documents</div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-700">{submission.user_phone || "N/A"}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-700">{submission.user_email || "N/A"}</div>
                </td>
                <td className="py-3 px-4">{getStatusBadge(submission.status)}</td>
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-700">
                    {new Date(submission.submitted_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setShowReviewModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {submissions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            No KYC submissions yet
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Review KYC Submission</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedSubmission.user_name} - {selectedSubmission.user_email}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setRejectionReason("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Submitted Name */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Name as per Documents</h4>
                  <p className="text-lg font-bold text-blue-900">{selectedSubmission.full_name || "Not provided"}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Verify this name matches the ID proof and PAN card uploaded below
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  {getStatusBadge(selectedSubmission.status)}
                  <span className="text-xs text-gray-500">
                    Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                  </span>
                </div>

                {/* Rejection Reason if rejected */}
                {selectedSubmission.status === "rejected" && selectedSubmission.rejection_reason && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">Rejection Reason:</h4>
                    <p className="text-sm text-red-800">{selectedSubmission.rejection_reason}</p>
                  </div>
                )}

                {/* Documents */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Uploaded Documents</h3>

                  {/* ID Proof */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">ID Proof with Photo</h4>
                    <a
                      href={selectedSubmission.id_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View Document
                    </a>
                  </div>

                  {/* PAN Card */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">PAN Card</h4>
                    <a
                      href={selectedSubmission.pan_card_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View Document
                    </a>
                  </div>

                  {/* Experience Certificate */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Experience Certificate / ID Card</h4>
                    <a
                      href={selectedSubmission.experience_certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View Document
                    </a>
                  </div>
                </div>

                {/* Rejection Reason Input */}
                {selectedSubmission.status === "pending" && canEdit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Explain why the KYC is being rejected..."
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              {selectedSubmission.status === "pending" && canEdit ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReject(selectedSubmission.id)}
                    disabled={isProcessing || !rejectionReason.trim()}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject KYC
                  </button>
                  <button
                    onClick={() => handleApprove(selectedSubmission.id)}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    Approve KYC
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
