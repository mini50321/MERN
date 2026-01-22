import { useState } from "react";
import { useAuth } from "@getmocha/users-service/react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Upload, Loader2, CheckCircle, AlertCircle, Download } from "lucide-react";
import { useToast } from "@/react-app/components/ToastContainer";

export default function AdminBookingSync() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ imported: number; failed: number } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const bookings = JSON.parse(text);

      if (!Array.isArray(bookings)) {
        showError("Invalid file format. Expected JSON array of bookings.");
        return;
      }

      setIsSyncing(true);
      const response = await fetch("/api/admin/bookings/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookings })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSyncResult({ imported: data.imported, failed: data.failed });
        showSuccess(data.message);
      } else {
        showError(data.error || "Failed to sync bookings");
      }
    } catch (error) {
      console.error("Error syncing bookings:", error);
      showError("Failed to parse or sync bookings file");
    } finally {
      setIsSyncing(false);
      e.target.value = "";
    }
  };

  const downloadSampleFormat = () => {
    const sample = [
      {
        patient_name: "John Doe",
        patient_contact: "+91 98765 43210",
        patient_email: "john@example.com",
        patient_location: "Mumbai, Maharashtra",
        service_type: "Repair",
        equipment_name: "CT Scanner",
        equipment_model: "Siemens SOMATOM",
        issue_description: "Machine not starting, showing error code E-405",
        urgency_level: "urgent",
        created_at: "2025-01-15T10:30:00Z"
      },
      {
        patient_name: "Jane Smith",
        patient_contact: "+91 87654 32109",
        patient_email: "jane@example.com",
        patient_location: "Delhi",
        service_type: "Maintenance",
        equipment_name: "X-Ray Machine",
        equipment_model: "GE Discovery",
        issue_description: "Routine maintenance required",
        urgency_level: "normal",
        created_at: "2025-01-15T11:00:00Z"
      }
    ];

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookings-sample.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">Please sign in as an admin to access this page</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 mb-20 lg:mb-0">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Booking Sync</h1>
              <p className="text-gray-600">Import service bookings from patient app</p>
            </div>
          </div>
        </div>

        {/* API Endpoint Information */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-200">
          <h2 className="text-lg font-bold text-gray-900 mb-3">API Endpoint for Patient App</h2>
          <div className="bg-white rounded-xl p-4 mb-3 border border-blue-200">
            <p className="text-sm text-gray-600 mb-2">POST Request URL:</p>
            <code className="block bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono break-all">
              https://mavypartner.com/api/bookings/submit
            </code>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <p className="text-sm text-gray-600 mb-2">Request Body Format (JSON):</p>
            <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono overflow-x-auto">
{`{
  "patient_name": "John Doe",
  "patient_contact": "+91 98765 43210",
  "patient_email": "john@example.com",
  "patient_location": "Mumbai, Maharashtra",
  "service_type": "Repair",
  "equipment_name": "CT Scanner",
  "equipment_model": "Siemens SOMATOM",
  "issue_description": "Machine not starting",
  "urgency_level": "urgent"
}`}
            </pre>
          </div>
        </div>

        {/* Bulk Import Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Bulk Import Bookings</h2>
            <p className="text-sm text-gray-600">Upload a JSON file with multiple booking requests</p>
          </div>

          <div className="p-6">
            {/* Sample Format Download */}
            <div className="mb-6">
              <button
                onClick={downloadSampleFormat}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Sample Format
              </button>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={isSyncing}
                className="hidden"
                id="booking-file-upload"
              />
              <label
                htmlFor="booking-file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-900 font-medium">Syncing bookings...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-900 font-medium mb-1">Click to upload JSON file</p>
                    <p className="text-sm text-gray-500">or drag and drop</p>
                  </>
                )}
              </label>
            </div>

            {/* Sync Results */}
            {syncResult && (
              <div className="mt-6 space-y-3">
                {syncResult.imported > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-900">
                        Successfully imported {syncResult.imported} booking{syncResult.imported !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                )}
                {syncResult.failed > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-900">
                        Failed to import {syncResult.failed} booking{syncResult.failed !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Integration Instructions</h3>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-900 mb-2">Option 1: Real-time API Integration</p>
              <p>Configure the patient app to POST booking requests directly to:</p>
              <code className="block bg-gray-100 p-2 rounded mt-2 text-xs">POST https://mavypartner.com/api/bookings/submit</code>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">Option 2: Bulk Import</p>
              <p>Export bookings from the patient app as JSON and upload here for bulk import.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">Required Fields:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>patient_name (required)</li>
                <li>patient_contact (required)</li>
                <li>issue_description (required)</li>
                <li>patient_email (optional)</li>
                <li>patient_location (optional)</li>
                <li>service_type (optional, defaults to "Repair")</li>
                <li>equipment_name (optional)</li>
                <li>equipment_model (optional)</li>
                <li>urgency_level (optional: "normal", "high", "urgent")</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
