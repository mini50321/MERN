import { useState, useEffect } from "react";
import { Download, Edit2, Trash2, Ban, CheckCircle, X, AlertCircle, Clock } from "lucide-react";
import * as XLSX from "xlsx";

interface User {
  id: number;
  user_id: string;
  full_name: string | null;
  email: string | null;
  state: string | null;
  country: string | null;
  subscription_tier: string;
  is_blocked: number;
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

export default function UserManagementPanel({ canEdit = true }: { canEdit?: boolean }) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    state: "",
    country: "",
    subscription: "",
  });
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editSubscription, setEditSubscription] = useState("");
  const [subscriptionReason, setSubscriptionReason] = useState("");
  
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  
  const [blockingUser, setBlockingUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState("");
  
  const [viewingRequests, setViewingRequests] = useState<User | null>(null);
  const [locationRequests, setLocationRequests] = useState<LocationRequest[]>([]);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, filters]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];
    
    if (filters.state) {
      filtered = filtered.filter(u => u.state === filters.state);
    }
    
    if (filters.country) {
      filtered = filtered.filter(u => u.country === filters.country);
    }
    
    if (filters.subscription) {
      filtered = filtered.filter(u => u.subscription_tier === filters.subscription);
    }
    
    setFilteredUsers(filtered);
  };

  const handleUpdateSubscription = async () => {
    if (!editingUser) return;
    
    try {
      const res = await fetch(`/api/admin/users/${editingUser.user_id}/subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription_tier: editSubscription,
          reason: subscriptionReason,
        }),
      });

      if (res.ok) {
        await loadUsers();
        setEditingUser(null);
        setEditSubscription("");
        setSubscriptionReason("");
        alert("Subscription updated successfully");
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      alert("Failed to update subscription");
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    if (deleteConfirmText !== "DELETE") {
      alert('Please type "DELETE" to confirm');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${deletingUser.user_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason }),
      });

      if (res.ok) {
        await loadUsers();
        setDeletingUser(null);
        setDeleteConfirmText("");
        setDeleteReason("");
        alert("User deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const handleBlockUser = async (block: boolean) => {
    if (!blockingUser) return;

    try {
      const res = await fetch(`/api/admin/users/${blockingUser.user_id}/${block ? "block" : "unblock"}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: blockReason }),
      });

      if (res.ok) {
        await loadUsers();
        setBlockingUser(null);
        setBlockReason("");
        alert(`User ${block ? "blocked" : "unblocked"} successfully`);
      }
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
      alert("Failed to update user status");
    }
  };

  const handleViewLocationRequests = async (user: User) => {
    setViewingRequests(user);
    try {
      const res = await fetch(`/api/admin/users/${user.user_id}/location-requests`);
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
        await loadUsers();
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
        await loadUsers();
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
      const params = new URLSearchParams();
      if (filters.state) params.append("state", filters.state);
      if (filters.country) params.append("country", filters.country);
      if (filters.subscription) params.append("subscription", filters.subscription);

      const res = await fetch(`/api/admin/users/export?${params}`);
      if (res.ok) {
        const data = await res.json();
        
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
        
        const filename = `users-export-${new Date().toISOString().split("T")[0]}.xlsx`;
        XLSX.writeFile(workbook, filename);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data");
    }
  };

  const uniqueStates = Array.from(new Set(users.map(u => u.state).filter(Boolean)));
  const uniqueCountries = Array.from(new Set(users.map(u => u.country).filter(Boolean)));

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          value={filters.subscription}
          onChange={(e) => setFilters({ ...filters, subscription: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Subscriptions</option>
          <option value="mavy_lite">Mavy Lite</option>
          <option value="mavy_plus">Mavy Plus</option>
          <option value="mavy_pro">Mavy Pro</option>
          <option value="mavy_max">Mavy Max</option>
        </select>

        <button
          onClick={() => setFilters({ state: "", country: "", subscription: "" })}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Clear Filters
        </button>

        <div className="ml-auto">
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Full Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">State</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Country</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Subscription</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.user_id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 text-sm">{user.full_name || "N/A"}</td>
                <td className="py-3 px-4 text-sm">{user.email || "N/A"}</td>
                <td className="py-3 px-4 text-sm">
                  <div className="flex items-center gap-2">
                    {user.state || "N/A"}
                    {user.pending_location_requests > 0 && (
                      <button
                        onClick={() => handleViewLocationRequests(user)}
                        className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center gap-1 hover:bg-orange-200"
                      >
                        <Clock className="w-3 h-3" />
                        Pending
                      </button>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm">{user.country || "N/A"}</td>
                <td className="py-3 px-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.subscription_tier === "mavy_max" ? "bg-purple-100 text-purple-800" :
                    user.subscription_tier === "mavy_pro" ? "bg-indigo-100 text-indigo-800" :
                    user.subscription_tier === "mavy_plus" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {user.subscription_tier === "mavy_lite" ? "Mavy Lite" :
                     user.subscription_tier === "mavy_plus" ? "Mavy Plus" :
                     user.subscription_tier === "mavy_pro" ? "Mavy Pro" :
                     user.subscription_tier === "mavy_max" ? "Mavy Max" :
                     user.subscription_tier || "Mavy Lite"}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">
                  {user.is_blocked ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      Blocked
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Active
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {canEdit ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setEditSubscription(user.subscription_tier);
                        }}
                        className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                        title="Edit Subscription"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setBlockingUser(user)}
                        className={`p-1.5 rounded transition-colors ${
                          user.is_blocked
                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                            : "bg-orange-100 text-orange-600 hover:bg-orange-200"
                        }`}
                        title={user.is_blocked ? "Unblock" : "Block"}
                      >
                        {user.is_blocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setDeletingUser(user)}
                        className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                        title="Delete User"
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

      {/* Edit Subscription Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Subscription</h3>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                <p className="text-sm text-gray-900">{editingUser.full_name || editingUser.email}</p>
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
                  onClick={() => setEditingUser(null)}
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
      {blockingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {blockingUser.is_blocked ? "Unblock User" : "Block User"}
              </h3>
              <button onClick={() => setBlockingUser(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <p className="text-sm text-orange-800">
                  {blockingUser.is_blocked
                    ? "This will restore the user's access to the application."
                    : "This will prevent the user from accessing the application."}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason {!blockingUser.is_blocked && "(Optional)"}
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder={blockingUser.is_blocked ? "Reason for unblocking..." : "Reason for blocking..."}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setBlockingUser(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBlockUser(!blockingUser.is_blocked)}
                  className={`flex-1 px-4 py-2 text-white rounded-lg ${
                    blockingUser.is_blocked
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {blockingUser.is_blocked ? "Unblock User" : "Block User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-900">Delete User</h3>
              <button onClick={() => setDeletingUser(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold">This action cannot be undone!</p>
                  <p className="mt-1">This will permanently delete {deletingUser.full_name || deletingUser.email} and all associated data.</p>
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
                  onClick={() => setDeletingUser(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={deleteConfirmText !== "DELETE"}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete User
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
