import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Edit,
  X,
  Clock,
  User,
  Briefcase,
  Star,
  AlertCircle,
  DollarSign,
  Loader2,
} from "lucide-react";

interface Booking {
  id: number;
  patient_user_id: string;
  patient_name: string;
  patient_contact: string;
  patient_email: string;
  patient_location: string;
  patient_address: string;
  patient_city: string;
  patient_state: string;
  service_type: string;
  service_category: string;
  equipment_name: string;
  equipment_model: string;
  issue_description: string;
  urgency_level: string;
  status: string;
  assigned_engineer_id: string;
  quoted_price: number;
  quoted_currency: string;
  engineer_notes: string;
  created_at: string;
  responded_at: string;
  completed_at: string;
  partner_name: string;
  partner_business: string;
  partner_rating: number;
  partner_review: string;
  user_rating: number;
  user_review: string;
  preferred_date: string;
  preferred_time: string;
  billing_frequency: string;
  monthly_visits_count: number;
  patient_condition: string;
}

interface BookingsManagementPanelProps {
  canEdit: boolean;
}

export default function BookingsManagementPanel({ canEdit }: BookingsManagementPanelProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, serviceFilter]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/all-patient-orders");
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.patient_name?.toLowerCase().includes(term) ||
          b.patient_contact?.toLowerCase().includes(term) ||
          b.patient_email?.toLowerCase().includes(term) ||
          b.partner_name?.toLowerCase().includes(term) ||
          b.partner_business?.toLowerCase().includes(term) ||
          b.id.toString().includes(term) ||
          b.service_type?.toLowerCase().includes(term) ||
          b.equipment_name?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Service filter
    if (serviceFilter !== "all") {
      filtered = filtered.filter(
        (b) => b.service_category?.toLowerCase().includes(serviceFilter.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-blue-100 text-blue-800",
      quote_sent: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      declined: "bg-gray-100 text-gray-800",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles: Record<string, string> = {
      emergency: "bg-red-100 text-red-800 border-red-300",
      urgent: "bg-orange-100 text-orange-800 border-orange-300",
      normal: "bg-blue-100 text-blue-800 border-blue-300",
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${styles[urgency] || "bg-gray-100 text-gray-800 border-gray-300"}`}>
        {urgency.toUpperCase()}
      </span>
    );
  };

  const handleSaveEdit = async () => {
    if (!editingBooking || !canEdit) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/service-orders/${editingBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editingBooking.status,
          service_type: editingBooking.service_type,
          service_category: editingBooking.service_category,
          equipment_name: editingBooking.equipment_name,
          equipment_model: editingBooking.equipment_model,
          issue_description: editingBooking.issue_description,
          urgency_level: editingBooking.urgency_level,
          quoted_price: editingBooking.quoted_price,
          engineer_notes: editingBooking.engineer_notes,
        }),
      });

      if (response.ok) {
        setEditingBooking(null);
        loadBookings();
        alert("Booking updated successfully");
      } else {
        alert("Failed to update booking");
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      alert("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (bookingId: number) => {
    if (!canEdit || !confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/service-orders/${bookingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadBookings();
        alert("Booking deleted successfully");
      } else {
        alert("Failed to delete booking");
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("An error occurred");
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    active: bookings.filter((b) => b.status === "accepted" || b.status === "quote_sent").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled" || b.status === "declined").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading bookings...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-4 lg:mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Total Bookings</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm text-yellow-700">Pending</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-700">Active</div>
          <div className="text-2xl font-bold text-blue-900">{stats.active}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-700">Completed</div>
          <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-sm text-red-700">Cancelled</div>
          <div className="text-2xl font-bold text-red-900">{stats.cancelled}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 lg:p-4 rounded-lg border border-gray-200 mb-4 lg:mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by order ID, patient, partner, service..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="quote_sent">Quote Sent</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="declined">Declined</option>
            </select>

            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Services</option>
              <option value="nursing">Nursing</option>
              <option value="physiotherapy">Physiotherapy</option>
              <option value="ambulance">Ambulance</option>
              <option value="biomedical">Biomedical</option>
              <option value="equipment">Equipment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto -mx-4 lg:mx-0">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 lg:py-3 px-3 lg:px-4 text-xs font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">Patient</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">Service</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">Partner</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">Urgency</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm font-semibold text-blue-600">#{booking.id}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-900">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(booking.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900">{booking.patient_name || "N/A"}</div>
                    <div className="text-xs text-gray-500">{booking.patient_contact}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900">{booking.service_category || "Service"}</div>
                    <div className="text-xs text-gray-500">{booking.service_type}</div>
                  </td>
                  <td className="py-3 px-4">
                    {booking.assigned_engineer_id ? (
                      <>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.partner_business || booking.partner_name || "Partner"}
                        </div>
                        {booking.partner_rating && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {booking.partner_rating}/5
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">Not assigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(booking.status)}</td>
                  <td className="py-3 px-4">{getUrgencyBadge(booking.urgency_level)}</td>
                  <td className="py-3 px-4">
                    {booking.quoted_price ? (
                      <div className="text-sm font-semibold text-green-600">
                        {booking.quoted_currency} {booking.quoted_price}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No quote</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingBooking(booking)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => setEditingBooking({ ...booking })}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="Edit Booking"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No bookings found matching your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* View Booking Modal */}
      {viewingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <p className="text-sm text-gray-600 mt-1">Order #{viewingBooking.id}</p>
              </div>
              <button onClick={() => setViewingBooking(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Patient Information */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Patient Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium text-gray-900">{viewingBooking.patient_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Contact:</span>
                      <a href={`tel:${viewingBooking.patient_contact}`} className="ml-2 font-medium text-blue-600 hover:underline">
                        {viewingBooking.patient_contact}
                      </a>
                    </div>
                    {viewingBooking.patient_email && (
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <a href={`mailto:${viewingBooking.patient_email}`} className="ml-2 font-medium text-blue-600 hover:underline">
                          {viewingBooking.patient_email}
                        </a>
                      </div>
                    )}
                    {viewingBooking.patient_location && (
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <span className="ml-2 font-medium text-gray-900">{viewingBooking.patient_location}</span>
                      </div>
                    )}
                    {viewingBooking.patient_condition && (
                      <div>
                        <span className="text-gray-600">Condition:</span>
                        <span className="ml-2 font-medium text-gray-900">{viewingBooking.patient_condition}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Partner Information */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Partner Information
                  </h3>
                  {viewingBooking.assigned_engineer_id ? (
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {viewingBooking.partner_business || viewingBooking.partner_name}
                        </span>
                      </div>
                      {viewingBooking.partner_rating && (
                        <div>
                          <span className="text-gray-600">Rating:</span>
                          <div className="ml-2 inline-flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= viewingBooking.partner_rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                            <span className="ml-1 font-medium text-gray-900">
                              ({viewingBooking.partner_rating}/5)
                            </span>
                          </div>
                        </div>
                      )}
                      {viewingBooking.partner_review && (
                        <div>
                          <span className="text-gray-600">Review:</span>
                          <p className="ml-2 mt-1 text-gray-900 italic">"{viewingBooking.partner_review}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No partner assigned yet</p>
                  )}
                </div>

                {/* Service Details */}
                <div className="md:col-span-2 bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-3">Service Details</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Category:</span>
                      <span className="ml-2 font-medium text-gray-900">{viewingBooking.service_category}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-medium text-gray-900">{viewingBooking.service_type}</span>
                    </div>
                    {viewingBooking.equipment_name && (
                      <div>
                        <span className="text-gray-600">Equipment:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {viewingBooking.equipment_name}
                          {viewingBooking.equipment_model && ` - ${viewingBooking.equipment_model}`}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Urgency:</span>
                      <span className="ml-2">{getUrgencyBadge(viewingBooking.urgency_level)}</span>
                    </div>
                    {viewingBooking.preferred_date && (
                      <div>
                        <span className="text-gray-600">Preferred Date:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(viewingBooking.preferred_date).toLocaleDateString()}
                          {viewingBooking.preferred_time && ` at ${viewingBooking.preferred_time}`}
                        </span>
                      </div>
                    )}
                    {viewingBooking.billing_frequency && (
                      <div>
                        <span className="text-gray-600">Billing:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {viewingBooking.billing_frequency}
                          {viewingBooking.monthly_visits_count && ` (${viewingBooking.monthly_visits_count} visits/month)`}
                        </span>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <span className="text-gray-600">Issue Description:</span>
                      <p className="ml-2 mt-1 text-gray-900">{viewingBooking.issue_description}</p>
                    </div>
                    {viewingBooking.engineer_notes && (
                      <div className="md:col-span-2">
                        <span className="text-gray-600">Partner Notes:</span>
                        <p className="ml-2 mt-1 text-gray-900 whitespace-pre-wrap">{viewingBooking.engineer_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing & Status */}
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Pricing & Status
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2">{getStatusBadge(viewingBooking.status)}</span>
                    </div>
                    {viewingBooking.quoted_price && (
                      <div>
                        <span className="text-gray-600">Quote Amount:</span>
                        <span className="ml-2 font-bold text-green-600">
                          {viewingBooking.quoted_currency} {viewingBooking.quoted_price}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Timeline
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(viewingBooking.created_at).toLocaleString()}
                      </span>
                    </div>
                    {viewingBooking.responded_at && (
                      <div>
                        <span className="text-gray-600">Responded:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(viewingBooking.responded_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {viewingBooking.completed_at && (
                      <div>
                        <span className="text-gray-600">Completed:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(viewingBooking.completed_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between">
              {canEdit && (
                <button
                  onClick={() => handleDelete(viewingBooking.id)}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
                >
                  Delete Booking
                </button>
              )}
              <button
                onClick={() => setViewingBooking(null)}
                className="ml-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Booking #{editingBooking.id}</h2>
              <button onClick={() => setEditingBooking(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editingBooking.status}
                    onChange={(e) => setEditingBooking({ ...editingBooking, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="quote_sent">Quote Sent</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Category</label>
                    <input
                      type="text"
                      value={editingBooking.service_category || ""}
                      onChange={(e) => setEditingBooking({ ...editingBooking, service_category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                    <input
                      type="text"
                      value={editingBooking.service_type || ""}
                      onChange={(e) => setEditingBooking({ ...editingBooking, service_type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Name</label>
                    <input
                      type="text"
                      value={editingBooking.equipment_name || ""}
                      onChange={(e) => setEditingBooking({ ...editingBooking, equipment_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Model</label>
                    <input
                      type="text"
                      value={editingBooking.equipment_model || ""}
                      onChange={(e) => setEditingBooking({ ...editingBooking, equipment_model: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issue Description</label>
                  <textarea
                    value={editingBooking.issue_description || ""}
                    onChange={(e) => setEditingBooking({ ...editingBooking, issue_description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                    <select
                      value={editingBooking.urgency_level}
                      onChange={(e) => setEditingBooking({ ...editingBooking, urgency_level: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quoted Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingBooking.quoted_price || ""}
                      onChange={(e) => setEditingBooking({ ...editingBooking, quoted_price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Engineer Notes</label>
                  <textarea
                    value={editingBooking.engineer_notes || ""}
                    onChange={(e) => setEditingBooking({ ...editingBooking, engineer_notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setEditingBooking(null)}
                disabled={isSaving}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
