import { useState, useEffect } from "react";
import { Download, Edit2, Trash2, Ban, CheckCircle, X, AlertCircle, Clock, Briefcase, Building2, Eye, ShoppingCart } from "lucide-react";
import * as XLSX from "xlsx";

interface Partner {
  id: number;
  user_id: string;
  full_name: string | null;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  profession: string | null;
  account_type: string | null;
  state: string | null;
  country: string | null;
  city: string | null;
  pincode: string | null;
  gst_number: string | null;
  workplace_type: string | null;
  workplace_name: string | null;
  bio: string | null;
  specialisation: string | null;
  subscription_tier: string;
  is_blocked: number;
  kyc_verified: number;
  created_at: string;
  updated_at: string;
  pending_location_requests: number;
}

interface LocationRequest {
  id: number;
  user_id: string;
  current_state: string | null;
  current_country: string | null;
  requested_state: string;
  requested_country: string;
  reason: string | null;
  status: string;
  created_at: string;
}

interface PartnerOrder {
  id: number;
  patient_name: string;
  service_type: string;
  service_category: string;
  status: string;
  quoted_price: number;
  created_at: string;
  completed_at: string;
}

export default function PartnerManagementPanel({ canEdit = true }: { canEdit?: boolean }) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    state: "",
    country: "",
    profession: "",
    account_type: "",
    subscription_tier: "",
  });
  
  const [editingSubscription, setEditingSubscription] = useState<Partner | null>(null);
  const [editSubscription, setEditSubscription] = useState("");
  const [subscriptionReason, setSubscriptionReason] = useState("");
  
  const [viewingPartner, setViewingPartner] = useState<Partner | null>(null);
  const [partnerOrders, setPartnerOrders] = useState<PartnerOrder[]>([]);
  
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  
  const [blockingPartner, setBlockingPartner] = useState<Partner | null>(null);
  const [blockReason, setBlockReason] = useState("");
  
  const [viewingRequests, setViewingRequests] = useState<Partner | null>(null);
  const [locationRequests, setLocationRequests] = useState<LocationRequest[]>([]);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [partners, filters]);

  const loadPartners = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/partners");
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
      }
    } catch (error) {
      console.error("Error loading partners:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...partners];
    
    if (filters.state) {
      filtered = filtered.filter(p => p.state === filters.state);
    }
    
    if (filters.country) {
      filtered = filtered.filter(p => p.country === filters.country);
    }
    
    if (filters.profession) {
      filtered = filtered.filter(p => p.profession?.toLowerCase().includes(filters.profession.toLowerCase()));
    }

    if (filters.account_type) {
      filtered = filtered.filter(p => p.account_type === filters.account_type);
    }

    if (filters.subscription_tier) {
      filtered = filtered.filter(p => (p.subscription_tier || "mavy_lite") === filters.subscription_tier);
    }
    
    setFilteredPartners(filtered);
  };

  const handleUpdateSubscription = async () => {
    if (!editingSubscription) return;
    
    try {
      const res = await fetch(`/api/admin/users/${editingSubscription.user_id}/subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription_tier: editSubscription,
          reason: subscriptionReason,
        }),
      });

      if (res.ok) {
        await loadPartners();
        setEditingSubscription(null);
        setEditSubscription("");
        setSubscriptionReason("");
        alert("Subscription updated successfully");
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      alert("Failed to update subscription");
    }
  };

  const handleViewPartnerDetails = async (partner: Partner) => {
    setViewingPartner(partner);
    
    // Load partner's orders
    try {
      const res = await fetch(`/api/admin/partner-orders/${partner.user_id}`);
      if (res.ok) {
        const data = await res.json();
        setPartnerOrders(data);
      }
    } catch (error) {
      console.error("Error loading partner orders:", error);
      setPartnerOrders([]);
    }
  };

  const handleDeletePartner = async () => {
    if (!deletingPartner) return;
    
    if (deleteConfirmText !== "DELETE") {
      alert('Please type "DELETE" to confirm');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${deletingPartner.user_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason }),
      });

      if (res.ok) {
        await loadPartners();
        setDeletingPartner(null);
        setDeleteConfirmText("");
        setDeleteReason("");
        alert("Partner deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting partner:", error);
      alert("Failed to delete partner");
    }
  };

  const handleBlockPartner = async (block: boolean) => {
    if (!blockingPartner) return;

    try {
      const res = await fetch(`/api/admin/users/${blockingPartner.user_id}/${block ? "block" : "unblock"}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: blockReason }),
      });

      if (res.ok) {
        await loadPartners();
        setBlockingPartner(null);
        setBlockReason("");
        setViewingPartner(null);
        alert(`Partner ${block ? "blocked" : "unblocked"} successfully`);
      }
    } catch (error) {
      console.error("Error blocking/unblocking partner:", error);
      alert("Failed to update partner status");
    }
  };

  const handleViewLocationRequests = async (partner: Partner) => {
    setViewingRequests(partner);
    try {
      const res = await fetch(`/api/admin/users/${partner.user_id}/location-requests`);
      if (res.ok) {
        const data = await res.json();
        setLocationRequests(data);
      }
    } catch (error) {
      console.error("Error loading location requests:", error);
    }
  };

  const handleApproveLocationRequest = async (requestId: number) => {
    try {
      const res = await fetch(`/api/admin/location-requests/${requestId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });

      if (res.ok) {
        await loadPartners();
        setViewingRequests(null);
        setLocationRequests([]);
        setAdminNotes("");
        alert("Location change approved");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request");
    }
  };

  const handleRejectLocationRequest = async (requestId: number) => {
    if (!adminNotes.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      const res = await fetch(`/api/admin/location-requests/${requestId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: adminNotes }),
      });

      if (res.ok) {
        await loadPartners();
        setViewingRequests(null);
        setLocationRequests([]);
        setAdminNotes("");
        alert("Location change rejected");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request");
    }
  };

  const handleExportToExcel = async () => {
    try {
      const exportData = filteredPartners.map(p => ({
        "Partner ID": p.user_id,
        "Full Name": p.full_name || "N/A",
        "Business Name": p.business_name || "N/A",
        "Email": p.email || "N/A",
        "Phone": p.phone || "N/A",
        "Profession": p.profession || "N/A",
        "Account Type": p.account_type || "N/A",
        "City": p.city || "N/A",
        "State": p.state || "N/A",
        "Country": p.country || "N/A",
        "Subscription": p.subscription_tier || "mavy_lite",
        "KYC Verified": p.kyc_verified ? "Yes" : "No",
        "Status": p.is_blocked ? "Blocked" : "Active",
        "Registered": new Date(p.created_at).toLocaleDateString(),
      }));
        
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Partners");
      
      const filename = `partners-export-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data");
    }
  };

  const uniqueStates = Array.from(new Set(partners.map(p => p.state).filter(Boolean)));
  const uniqueCountries = Array.from(new Set(partners.map(p => p.country).filter(Boolean)));
  const uniqueProfessions = Array.from(new Set(partners.map(p => p.profession).filter(Boolean)));

  const getServiceTypeBadgeColor = (profession: string | null) => {
    if (!profession) return "bg-gray-100 text-gray-800";
    const prof = profession.toLowerCase();
    if (prof.includes("nursing")) return "bg-pink-100 text-pink-800";
    if (prof.includes("physio")) return "bg-purple-100 text-purple-800";
    if (prof.includes("ambulance") || prof.includes("emergency")) return "bg-red-100 text-red-800";
    if (prof.includes("biomedical") || prof.includes("clinical")) return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading partners...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Partner Management</h2>
          <p className="text-sm text-gray-600">Manage all service providers and partners</p>
        </div>
      </div>

      {/* Filters and Export */}
      <div className="bg-gray-50 p-4 rounded-lg flex flex-wrap items-center gap-4">
        <select
          value={filters.state}
          onChange={(e) => setFilters({ ...filters, state: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All States</option>
          {uniqueStates.map(state => (
            <option key={state} value={state as string}>{state}</option>
          ))}
        </select>

        <select
          value={filters.country}
          onChange={(e) => setFilters({ ...filters, country: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Countries</option>
          {uniqueCountries.map(country => (
            <option key={country} value={country as string}>{country}</option>
          ))}
        </select>

        <select
          value={filters.profession}
          onChange={(e) => setFilters({ ...filters, profession: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Service Types</option>
          {uniqueProfessions.map(prof => (
            <option key={prof} value={prof as string}>{prof}</option>
          ))}
        </select>

        <select
          value={filters.account_type}
          onChange={(e) => setFilters({ ...filters, account_type: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Account Types</option>
          <option value="individual">Individual</option>
          <option value="business">Business</option>
          <option value="freelancer">Freelancer</option>
        </select>

        <select
          value={filters.subscription_tier}
          onChange={(e) => setFilters({ ...filters, subscription_tier: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Subscriptions</option>
          <option value="mavy_lite">Mavy Lite</option>
          <option value="mavy_plus">Mavy Plus</option>
          <option value="mavy_pro">Mavy Pro</option>
          <option value="mavy_max">Mavy Max</option>
        </select>

        <button
          onClick={() => setFilters({ state: "", country: "", profession: "", account_type: "", subscription_tier: "" })}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Clear Filters
        </button>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-sm text-gray-600">
            {filteredPartners.length} partner{filteredPartners.length !== 1 ? "s" : ""}
          </div>
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Partners Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Partner Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Service Type</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Account Type</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Location</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Subscription</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPartners.map((partner) => (
              <tr key={partner.user_id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {partner.business_name || partner.full_name || "N/A"}
                    </div>
                    {partner.business_name && partner.full_name && (
                      <div className="text-xs text-gray-500">{partner.full_name}</div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm">
                    <div className="text-gray-900">{partner.email || "N/A"}</div>
                    {partner.phone && (
                      <div className="text-xs text-gray-500">{partner.phone}</div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceTypeBadgeColor(partner.profession)}`}>
                    {partner.profession || "Not Specified"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    {partner.account_type === "business" ? (
                      <>
                        <Building2 className="w-4 h-4" />
                        <span>Business</span>
                      </>
                    ) : partner.account_type === "freelancer" ? (
                      <>
                        <Briefcase className="w-4 h-4" />
                        <span>Freelancer</span>
                      </>
                    ) : (
                      <span>Individual</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      {partner.city && <span className="text-gray-900">{partner.city},</span>}
                      <span className="text-gray-700">{partner.state || "N/A"}</span>
                      {partner.pending_location_requests > 0 && (
                        <button
                          onClick={() => handleViewLocationRequests(partner)}
                          className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1 hover:bg-orange-200"
                        >
                          <Clock className="w-3 h-3" />
                          Pending
                        </button>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => {
                      setEditingSubscription(partner);
                      setEditSubscription(partner.subscription_tier || "mavy_lite");
                    }}
                    className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                      (partner.subscription_tier || "mavy_lite") === "mavy_max" ? "bg-purple-100 text-purple-800" :
                      (partner.subscription_tier || "mavy_lite") === "mavy_pro" ? "bg-indigo-100 text-indigo-800" :
                      (partner.subscription_tier || "mavy_lite") === "mavy_plus" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                    }`}
                    title="Click to edit subscription"
                  >
                    {(partner.subscription_tier || "mavy_lite") === "mavy_lite" ? "Lite" :
                     (partner.subscription_tier || "mavy_lite") === "mavy_plus" ? "Plus" :
                     (partner.subscription_tier || "mavy_lite") === "mavy_pro" ? "Pro" :
                     (partner.subscription_tier || "mavy_lite") === "mavy_max" ? "Max" :
                     "Lite"}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    {partner.is_blocked ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium w-fit">
                        Blocked
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium w-fit">
                        Active
                      </span>
                    )}
                    {partner.kyc_verified === 1 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium w-fit">
                        KYC ✓
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {canEdit ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewPartnerDetails(partner)}
                        className="p-1.5 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingSubscription(partner);
                          setEditSubscription(partner.subscription_tier);
                        }}
                        className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                        title="Edit Subscription"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingPartner(partner)}
                        className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                        title="Delete Partner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">View Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Partner Details Modal */}
      {viewingPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Partner Details</h3>
                <p className="text-sm text-gray-600">{viewingPartner.business_name || viewingPartner.full_name}</p>
              </div>
              <button onClick={() => setViewingPartner(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Information */}
              <div className="bg-gray-50 rounded-lg p-5">
                <h4 className="font-semibold text-gray-900 mb-4">Profile Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Full Name:</span>
                    <p className="font-medium text-gray-900">{viewingPartner.full_name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Business Name:</span>
                    <p className="font-medium text-gray-900">{viewingPartner.business_name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium text-gray-900">{viewingPartner.email || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium text-gray-900">{viewingPartner.phone || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Service Type:</span>
                    <p className="font-medium text-gray-900">{viewingPartner.profession || "Not Specified"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Account Type:</span>
                    <p className="font-medium text-gray-900 capitalize">{viewingPartner.account_type || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">City:</span>
                    <p className="font-medium text-gray-900">{viewingPartner.city || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">State:</span>
                    <p className="font-medium text-gray-900">{viewingPartner.state || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Country:</span>
                    <p className="font-medium text-gray-900">{viewingPartner.country || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Pincode:</span>
                    <p className="font-medium text-gray-900">{viewingPartner.pincode || "N/A"}</p>
                  </div>
                  {viewingPartner.gst_number && (
                    <div>
                      <span className="text-gray-600">GST Number:</span>
                      <p className="font-medium text-gray-900">{viewingPartner.gst_number}</p>
                    </div>
                  )}
                  {viewingPartner.workplace_name && (
                    <div>
                      <span className="text-gray-600">Workplace:</span>
                      <p className="font-medium text-gray-900">{viewingPartner.workplace_name}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Subscription:</span>
                    <p className="font-medium text-gray-900 capitalize">{viewingPartner.subscription_tier.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">KYC Status:</span>
                    <p className="font-medium text-gray-900">{viewingPartner.kyc_verified ? "Verified ✓" : "Not Verified"}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Registered:</span>
                    <p className="font-medium text-gray-900">{new Date(viewingPartner.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <p className="font-medium text-gray-900">{new Date(viewingPartner.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {viewingPartner.bio && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-gray-600 text-sm">Bio:</span>
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{viewingPartner.bio}</p>
                  </div>
                )}

                {viewingPartner.specialisation && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-gray-600 text-sm">Specialisation:</span>
                    <p className="text-sm text-gray-900 mt-1">{viewingPartner.specialisation}</p>
                  </div>
                )}
              </div>

              {/* Service Orders */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Service Orders ({partnerOrders.length})
                </h4>
                {partnerOrders.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8 bg-gray-50 rounded-lg">No orders found</p>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Order ID</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Patient</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Service</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Price</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Status</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partnerOrders.slice(0, 10).map((order) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3 text-xs">#{order.id}</td>
                            <td className="py-2 px-3 text-xs">{order.patient_name}</td>
                            <td className="py-2 px-3 text-xs">
                              {order.service_category ? `${order.service_category} - ${order.service_type}` : order.service_type}
                            </td>
                            <td className="py-2 px-3 text-xs">₹{order.quoted_price || "N/A"}</td>
                            <td className="py-2 px-3 text-xs">
                              <span className={`px-2 py-0.5 rounded-full ${
                                order.status === "completed" ? "bg-green-100 text-green-800" :
                                order.status === "accepted" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-xs">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setBlockingPartner(viewingPartner);
                    setViewingPartner(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium ${
                    viewingPartner.is_blocked
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-orange-600 text-white hover:bg-orange-700"
                  }`}
                >
                  {viewingPartner.is_blocked ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Unblock Partner
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4" />
                      Block Partner
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setDeletingPartner(viewingPartner);
                    setViewingPartner(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Partner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {editingSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Subscription</h3>
              <button onClick={() => setEditingSubscription(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Partner</label>
                <p className="text-sm text-gray-900">{editingSubscription.business_name || editingSubscription.full_name || editingSubscription.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Tier</label>
                <select
                  value={editSubscription}
                  onChange={(e) => setEditSubscription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mavy_lite">Mavy Lite</option>
                  <option value="mavy_plus">Mavy Plus</option>
                  <option value="mavy_pro">Mavy Pro</option>
                  <option value="mavy_max">Mavy Max</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                <textarea
                  value={subscriptionReason}
                  onChange={(e) => setSubscriptionReason(e.target.value)}
                  placeholder="Reason for subscription change..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditingSubscription(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSubscription}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block/Unblock Modal */}
      {blockingPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {blockingPartner.is_blocked ? "Unblock Partner" : "Block Partner"}
              </h3>
              <button onClick={() => setBlockingPartner(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <p className="text-sm text-orange-800">
                  {blockingPartner.is_blocked
                    ? "This will restore the partner's access to the application."
                    : "This will prevent the partner from accessing the application and accepting new orders."}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason {!blockingPartner.is_blocked && "(Optional)"}
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder={blockingPartner.is_blocked ? "Reason for unblocking..." : "Reason for blocking..."}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setBlockingPartner(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBlockPartner(!blockingPartner.is_blocked)}
                  className={`flex-1 px-4 py-2 text-white rounded-lg ${
                    blockingPartner.is_blocked
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {blockingPartner.is_blocked ? "Unblock Partner" : "Block Partner"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Partner Modal */}
      {deletingPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-900">Delete Partner</h3>
              <button onClick={() => setDeletingPartner(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold">This action cannot be undone!</p>
                  <p className="mt-1">This will permanently delete {deletingPartner.business_name || deletingPartner.full_name || deletingPartner.email} and all associated data.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Reason for deletion..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingPartner(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePartner}
                  disabled={deleteConfirmText !== "DELETE"}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Partner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Requests Modal */}
      {viewingRequests && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Location Change Requests</h3>
              <button onClick={() => setViewingRequests(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {locationRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending requests</p>
              ) : (
                locationRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Current Location</p>
                        <p className="text-sm font-medium">
                          {request.current_state && request.current_country
                            ? `${request.current_state}, ${request.current_country}`
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Requested Location</p>
                        <p className="text-sm font-medium text-blue-600">
                          {request.requested_state}, {request.requested_country}
                        </p>
                      </div>
                    </div>

                    {request.reason && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Reason</p>
                        <p className="text-sm text-gray-700">{request.reason}</p>
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Notes
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes about this decision..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRejectLocationRequest(request.id)}
                        className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveLocationRequest(request.id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Approve
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
  );
}
