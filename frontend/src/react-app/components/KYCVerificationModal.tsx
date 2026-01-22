import { useState } from "react";
import { Upload, X, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";

interface KYCVerificationModalProps {
  onClose: () => void;
  kycStatus: {
    status: string;
    rejection_reason?: string;
    submitted_at?: string;
  } | null;
  onSubmitSuccess: () => void;
}

export default function KYCVerificationModal({
  onClose,
  kycStatus,
  onSubmitSuccess,
}: KYCVerificationModalProps) {
  const [fullName, setFullName] = useState<string>("");
  const [idProof, setIdProof] = useState<File | null>(null);
  const [panCard, setPanCard] = useState<File | null>(null);
  const [experienceCertificate, setExperienceCertificate] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        alert("Only PDF and image files are allowed");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setter(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      alert("Please enter your full name as it appears on your documents");
      return;
    }

    if (!idProof || !panCard || !experienceCertificate) {
      alert("Please upload all required documents");
      return;
    }

    setIsUploading(true);

    try {
      // Upload ID proof
      setUploadProgress("Uploading ID proof...");
      const idProofForm = new FormData();
      idProofForm.append("document", idProof);
      idProofForm.append("document_type", "id_proof");

      const idProofRes = await fetch("/api/kyc/upload-document", {
        method: "POST",
        body: idProofForm,
      });

      if (!idProofRes.ok) {
        throw new Error("Failed to upload ID proof");
      }

      const idProofData = await idProofRes.json();

      // Upload PAN card
      setUploadProgress("Uploading PAN card...");
      const panCardForm = new FormData();
      panCardForm.append("document", panCard);
      panCardForm.append("document_type", "pan_card");

      const panCardRes = await fetch("/api/kyc/upload-document", {
        method: "POST",
        body: panCardForm,
      });

      if (!panCardRes.ok) {
        throw new Error("Failed to upload PAN card");
      }

      const panCardData = await panCardRes.json();

      // Upload experience certificate
      setUploadProgress("Uploading experience certificate...");
      const experienceForm = new FormData();
      experienceForm.append("document", experienceCertificate);
      experienceForm.append("document_type", "experience_certificate");

      const experienceRes = await fetch("/api/kyc/upload-document", {
        method: "POST",
        body: experienceForm,
      });

      if (!experienceRes.ok) {
        throw new Error("Failed to upload experience certificate");
      }

      const experienceData = await experienceRes.json();

      // Submit KYC
      setUploadProgress("Submitting KYC verification...");
      const submitRes = await fetch("/api/kyc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          id_proof_url: idProofData.file_url,
          pan_card_url: panCardData.file_url,
          experience_certificate_url: experienceData.file_url,
        }),
      });

      if (!submitRes.ok) {
        throw new Error("Failed to submit KYC");
      }

      alert("KYC documents submitted successfully! Please wait for admin approval.");
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error("KYC submission error:", error);
      alert(error instanceof Error ? error.message : "Failed to submit KYC");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const getStatusDisplay = () => {
    if (!kycStatus) {
      return (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900">KYC Verification Required</h4>
            <p className="text-sm text-yellow-700 mt-1">
              To access the Earn section and receive service requests, please complete your KYC verification by uploading the required documents.
            </p>
          </div>
        </div>
      );
    }

    if (kycStatus.status === "pending") {
      return (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">Verification Under Review</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your KYC documents have been submitted and are currently under review by our admin team. This typically takes 1-2 business days.
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Submitted: {new Date(kycStatus.submitted_at!).toLocaleString()}
            </p>
          </div>
        </div>
      );
    }

    if (kycStatus.status === "rejected") {
      return (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900">KYC Verification Rejected</h4>
            <p className="text-sm text-red-700 mt-1">
              Your KYC documents were reviewed but did not meet our verification requirements.
            </p>
            {kycStatus.rejection_reason && (
              <div className="mt-2 p-3 bg-red-100 rounded-lg">
                <p className="text-sm font-medium text-red-900">Reason:</p>
                <p className="text-sm text-red-800 mt-1">{kycStatus.rejection_reason}</p>
              </div>
            )}
            <p className="text-sm text-red-700 mt-3">
              Please resubmit your documents with the correct information.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">KYC Verification</h2>
            <p className="text-sm text-gray-600 mt-1">
              Verify your identity to access service requests
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {getStatusDisplay()}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name (as per documents) <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Enter your full name exactly as it appears on your ID proof and PAN card
              </p>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full legal name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* ID Proof with Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Proof with Photo <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload Aadhaar card, Driving License, or Passport (PDF or Image)
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  id="id-proof"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, setIdProof)}
                  className="hidden"
                />
                <label
                  htmlFor="id-proof"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {idProof ? idProof.name : "Click to upload ID proof"}
                  </span>
                  {idProof && (
                    <span className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      File selected
                    </span>
                  )}
                </label>
              </div>
            </div>

            {/* PAN Card */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PAN Card <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload your PAN card for income tax verification (PDF or Image)
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  id="pan-card"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, setPanCard)}
                  className="hidden"
                />
                <label
                  htmlFor="pan-card"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {panCard ? panCard.name : "Click to upload PAN card"}
                  </span>
                  {panCard && (
                    <span className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      File selected
                    </span>
                  )}
                </label>
              </div>
            </div>

            {/* Experience Certificate / ID Card */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Certificate or Professional ID Card <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload document proving you are a healthcare technician (PDF or Image)
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  id="experience-cert"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, setExperienceCertificate)}
                  className="hidden"
                />
                <label
                  htmlFor="experience-cert"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {experienceCertificate
                      ? experienceCertificate.name
                      : "Click to upload certificate/ID"}
                  </span>
                  {experienceCertificate && (
                    <span className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      File selected
                    </span>
                  )}
                </label>
              </div>
            </div>

            {uploadProgress && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-blue-900">{uploadProgress}</span>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUploading}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !fullName.trim() || !idProof || !panCard || !experienceCertificate}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Submit KYC Documents
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
