import { useState, useEffect } from "react";
import { useAuth } from "@getmocha/users-service/react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Search, Download, FileText, Upload, MessageSquare, Trash2, X, Plus } from "lucide-react";

interface ServiceManual {
  id: number;
  title: string;
  manufacturer: string | null;
  model_number: string | null;
  equipment_type: string | null;
  description: string | null;
  file_url: string;
  uploaded_by_user_id: string;
  uploader_name: string | null;
  uploader_picture: string | null;
  download_count: number;
  created_at: string;
}

interface ManualRequest {
  id: number;
  user_id: string;
  equipment_name: string;
  manufacturer: string | null;
  model_number: string | null;
  description: string | null;
  status: string;
  requester_name: string | null;
  requester_picture: string | null;
  replies_count: number;
  created_at: string;
}

interface ManualReply {
  id: number;
  request_id: number;
  user_id: string;
  message: string | null;
  manual_file_url: string;
  manual_title: string;
  replier_name: string | null;
  replier_picture: string | null;
  created_at: string;
}

export default function Manuals() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"manuals" | "requests">("manuals");
  const [manuals, setManuals] = useState<ServiceManual[]>([]);
  const [requests, setRequests] = useState<ManualRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ManualRequest | null>(null);
  const [requestReplies, setRequestReplies] = useState<ManualReply[]>([]);
  const [showRepliesModal, setShowRepliesModal] = useState(false);

  const equipmentTypes = [
    "All",
    "Imaging",
    "Laboratory",
    "Life Support",
    "Patient Monitoring",
    "Surgical",
    "Therapeutic"
  ];

  useEffect(() => {
    fetchData();
  }, [searchQuery, selectedType, activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "manuals") {
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (selectedType && selectedType !== "All") params.append("type", selectedType);
        
        const response = await fetch(`/api/manuals?${params}`);
        const data = await response.json();
        setManuals(data);
      } else {
        const response = await fetch("/api/manual-requests");
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadManual = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/manuals/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setShowUploadModal(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error uploading manual:", error);
    }
  };

  const handleRequestManual = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch("/api/manual-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipment_name: formData.get("equipment_name"),
          manufacturer: formData.get("manufacturer"),
          model_number: formData.get("model_number"),
          description: formData.get("description"),
        }),
      });

      if (response.ok) {
        setShowRequestModal(false);
        setActiveTab("requests");
        fetchData();
      }
    } catch (error) {
      console.error("Error creating request:", error);
    }
  };

  const handleReplyToRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(`/api/manual-requests/${selectedRequest!.id}/reply`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        setShowReplyModal(false);
        setSelectedRequest(null);
        fetchData();
      }
    } catch (error) {
      console.error("Error replying to request:", error);
    }
  };

  const handleDeleteManual = async (manualId: number) => {
    if (!confirm("Are you sure you want to delete this manual?")) return;

    try {
      const response = await fetch(`/api/manuals/${manualId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting manual:", error);
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    try {
      const response = await fetch(`/api/manual-requests/${requestId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting request:", error);
    }
  };

  const handleViewReplies = async (request: ManualRequest) => {
    setSelectedRequest(request);
    setShowRepliesModal(true);

    try {
      const response = await fetch(`/api/manual-requests/${request.id}/replies`);
      const data = await response.json();
      setRequestReplies(data);
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  };

  const downloadManual = (url: string, title: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}.pdf`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto mb-20 lg:mb-0">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Manuals Community</h1>
            <p className="text-gray-600">Share manuals, request help, and support each other</p>
          </div>
          {user && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <Upload className="w-5 h-5" />
                <span className="font-medium">Share Manual</span>
              </button>
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Request Manual</span>
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab("manuals")}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "manuals"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Shared Manuals
              </span>
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === "requests"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Manual Requests
              </span>
            </button>
          </div>

          {activeTab === "manuals" && (
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by equipment, manufacturer, or model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {equipmentTypes.map((type) => (
                  <option key={type} value={type === "All" ? "" : type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="w-full h-40 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : activeTab === "manuals" ? (
          manuals.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No manuals found</h3>
              <p className="text-gray-600 mb-6">Be the first to share a manual with the community!</p>
              {user && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Share Manual
                </button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {manuals.map((manual) => (
                <div
                  key={manual.id}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative"
                >
                  {user?.id === manual.uploaded_by_user_id && (
                    <button
                      onClick={() => handleDeleteManual(manual.id)}
                      className="absolute top-4 right-4 p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete manual"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl mb-4 flex items-center justify-center">
                    <FileText className="w-16 h-16 text-blue-600" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 pr-8">
                    {manual.title}
                  </h3>
                  
                  {manual.manufacturer && (
                    <p className="text-sm text-gray-600 mb-1">{manual.manufacturer}</p>
                  )}
                  {manual.model_number && (
                    <p className="text-sm text-gray-500 mb-3">{manual.model_number}</p>
                  )}
                  
                  <div className="flex items-center gap-2 mb-4">
                    {manual.uploader_picture ? (
                      <img
                        src={manual.uploader_picture}
                        alt={manual.uploader_name || "User"}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {(manual.uploader_name || "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-gray-600">
                      Shared by {manual.uploader_name || "Anonymous"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {manual.download_count} downloads
                    </span>
                    <button
                      onClick={() => downloadManual(manual.file_url, manual.title)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-medium">Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          requests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No manual requests</h3>
              <p className="text-gray-600 mb-6">Request a manual and the community will help!</p>
              {user && (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Request Manual
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      {request.requester_picture ? (
                        <img
                          src={request.requester_picture}
                          alt={request.requester_name || "User"}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                          <span className="text-white text-lg font-bold">
                            {(request.requester_name || "U").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            {request.equipment_name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === "open"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {request.status === "open" ? "Open" : "Resolved"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Requested by {request.requester_name || "Anonymous"}
                        </p>
                        {request.manufacturer && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Manufacturer:</span> {request.manufacturer}
                          </p>
                        )}
                        {request.model_number && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Model:</span> {request.model_number}
                          </p>
                        )}
                        {request.description && (
                          <p className="text-sm text-gray-600 mt-2">{request.description}</p>
                        )}
                      </div>
                    </div>
                    {user?.id === request.user_id && (
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                    {request.replies_count > 0 && (
                      <button
                        onClick={() => handleViewReplies(request)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {request.replies_count} {request.replies_count === 1 ? "Reply" : "Replies"}
                        </span>
                      </button>
                    )}
                    {user && (
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowReplyModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-md transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        <span className="text-sm font-medium">Share Manual</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Upload Manual Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold text-gray-900">Share Manual</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleUploadManual} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manual Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="e.g., GE LOGIQ E9 User Manual"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      name="manufacturer"
                      placeholder="e.g., GE Healthcare"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model Number
                    </label>
                    <input
                      type="text"
                      name="model_number"
                      placeholder="e.g., LOGIQ E9"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipment Type
                  </label>
                  <select
                    name="equipment_type"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select type (optional)</option>
                    {equipmentTypes.filter(t => t !== "All").map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Optional description or notes about this manual..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PDF File * (Max 50MB)
                  </label>
                  <input
                    type="file"
                    name="file"
                    accept=".pdf"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Upload Manual
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Request Manual Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-2xl font-bold text-gray-900">Request Manual</h2>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleRequestManual} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    name="equipment_name"
                    required
                    placeholder="e.g., Ultrasound Machine"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      name="manufacturer"
                      placeholder="e.g., Philips"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model Number
                    </label>
                    <input
                      type="text"
                      name="model_number"
                      placeholder="e.g., HD15"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Details
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    placeholder="Describe what you're looking for or any specific sections you need..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Post Request
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Reply to Request Modal */}
        {showReplyModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Share Manual</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Helping with: {selectedRequest.equipment_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setSelectedRequest(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleReplyToRequest} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manual Title *
                  </label>
                  <input
                    type="text"
                    name="manual_title"
                    required
                    placeholder="e.g., Service Manual - Philips HD15"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PDF File * (Max 50MB)
                  </label>
                  <input
                    type="file"
                    name="file"
                    accept=".pdf"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="Add a helpful message..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Share Manual
                </button>
              </form>
            </div>
          </div>
        )}

        {/* View Replies Modal */}
        {showRepliesModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Replies</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedRequest.equipment_name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowRepliesModal(false);
                    setSelectedRequest(null);
                    setRequestReplies([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {requestReplies.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No replies yet</p>
                ) : (
                  requestReplies.map((reply) => (
                    <div key={reply.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {reply.replier_picture ? (
                          <img
                            src={reply.replier_picture}
                            alt={reply.replier_name || "User"}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <span className="text-white font-bold">
                              {(reply.replier_name || "U").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {reply.replier_name || "Anonymous"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(reply.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {reply.message && (
                        <p className="text-sm text-gray-700 mb-3">{reply.message}</p>
                      )}

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {reply.manual_title}
                          </span>
                        </div>
                        <button
                          onClick={() => downloadManual(reply.manual_file_url, reply.manual_title)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm font-medium">Download</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
