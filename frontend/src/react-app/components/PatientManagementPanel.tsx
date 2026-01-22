import { useState, useMemo } from "react";
import {
  Phone,
  Mail,
  Edit,
  Trash2,
  XCircle,
  CheckCircle,
  X,
  Save,
  FileText,
  Download,
  Filter,
} from "lucide-react";

interface Patient {
  user_id: string;
  patient_full_name: string;
  patient_contact: string;
  patient_email: string;
  patient_address: string;
  patient_city: string;
  state: string;
  patient_pincode: string;
  patient_latitude: number;
  patient_longitude: number;
  is_blocked: number;
  onboarding_completed: number;
  total_bookings: number;
  created_at: string;
}

interface ServiceOrder {
  id: number;
  patient_name: string;
  patient_contact: string;
  patient_email: string;
  patient_location: string;
  service_type: string;
  service_category: string;
  equipment_name: string;
  equipment_model: string;
  issue_description: string;
  urgency_level: string;
  status: string;
  quoted_price: number;
  engineer_notes: string;
  partner_name: string;
  partner_business: string;
  created_at: string;
}

export default function PatientManagementPanel({
  patients,
  onReload,
  canEdit,
}: {
  patients: Patient[];
  onReload: () => void;
  canEdit: boolean;
}) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientBookings, setPatientBookings] = useState<ServiceOrder[]>([]);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [showAllOrdersModal, setShowAllOrdersModal] = useState(false);
  const [allOrders, setAllOrders] = useState<ServiceOrder[]>([]);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<ServiceOrder | null>(null);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    patient_full_name: "",
    patient_contact: "",
    patient_email: "",
    patient_address: "",
    patient_city: "",
    patient_pincode: "",
  });
  const [bookingEditForm, setBookingEditForm] = useState({
    status: "",
    service_type: "",
    service_category: "",
    equipment_name: "",
    equipment_model: "",
    issue_description: "",
    urgency_level: "",
    quoted_price: "",
    engineer_notes: "",
  });

  const handleViewBookings = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsLoadingBookings(true);
    setShowBookingsModal(true);

    try {
      const res = await fetch(`/api/admin/patients/${patient.user_id}/bookings`);
      if (res.ok) {
        const bookings = await res.json();
        setPatientBookings(bookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleEditProfile = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditForm({
      patient_full_name: patient.patient_full_name || "",
      patient_contact: patient.patient_contact || "",
      patient_email: patient.patient_email || "",
      patient_address: patient.patient_address || "",
      patient_city: patient.patient_city || "",
      patient_pincode: patient.patient_pincode || "",
    });
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async () => {
    if (!selectedPatient || !canEdit) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/patients/${selectedPatient.user_id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        alert("Patient profile updated successfully");
        setShowEditProfileModal(false);
        onReload();
      } else {
        alert("Failed to update patient profile");
      }
    } catch (error) {
      console.error("Error updating patient profile:", error);
      alert("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditBooking = (booking: ServiceOrder) => {
    setEditingBooking(booking);
    setBookingEditForm({
      status: booking.status || "",
      service_type: booking.service_type || "",
      service_category: booking.service_category || "",
      equipment_name: booking.equipment_name || "",
      equipment_model: booking.equipment_model || "",
      issue_description: booking.issue_description || "",
      urgency_level: booking.urgency_level || "",
      quoted_price: booking.quoted_price?.toString() || "",
      engineer_notes: booking.engineer_notes || "",
    });
    setShowEditBookingModal(true);
  };

  const handleSaveBooking = async () => {
    if (!editingBooking || !canEdit) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/service-orders/${editingBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingEditForm,
          quoted_price: bookingEditForm.quoted_price ? parseFloat(bookingEditForm.quoted_price) : null,
        }),
      });

      if (res.ok) {
        alert("Service order updated successfully");
        setShowEditBookingModal(false);
        if (selectedPatient) {
          handleViewBookings(selectedPatient);
        }
      } else {
        alert("Failed to update service order");
      }
    } catch (error) {
      console.error("Error updating service order:", error);
      alert("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBooking = async (bookingId: number) => {
    if (!canEdit || !confirm("Are you sure you want to delete this service order?")) return;

    try {
      const res = await fetch(`/api/admin/service-orders/${bookingId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Service order deleted successfully");
        if (selectedPatient) {
          handleViewBookings(selectedPatient);
        }
      } else {
        alert("Failed to delete service order");
      }
    } catch (error) {
      console.error("Error deleting service order:", error);
      alert("An error occurred");
    }
  };

  const handleBlockPatient = async (userId: string, isBlocked: boolean) => {
    if (!canEdit) return;

    const action = isBlocked ? "unblock" : "block";
    if (!confirm(`Are you sure you want to ${action} this patient?`)) return;

    const endpoint = isBlocked
      ? `/api/admin/patients/${userId}/unblock`
      : `/api/admin/patients/${userId}/block`;

    const res = await fetch(endpoint, { method: "PUT" });

    if (res.ok) {
      alert(`Patient ${action}ed successfully`);
      onReload();
    } else {
      alert(`Failed to ${action} patient`);
    }
  };

  const handleDeletePatient = async (userId: string) => {
    if (!canEdit || !confirm("Are you sure you want to permanently delete this patient and all their bookings? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/patients/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Patient deleted successfully");
        onReload();
      } else {
        alert("Failed to delete patient");
      }
    } catch (error) {
      console.error("Error deleting patient:", error);
      alert("An error occurred");
    }
  };

  const handleViewAllOrders = async () => {
    setIsLoadingBookings(true);
    setShowAllOrdersModal(true);

    try {
      const res = await fetch("/api/admin/all-patient-orders");
      if (res.ok) {
        const orders = await res.json();
        setAllOrders(orders);
      }
    } catch (error) {
      console.error("Error fetching all orders:", error);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleDownloadExcel = () => {
    // Create CSV content from patient data
    const headers = [
      "Patient Name",
      "Contact",
      "Email",
      "Address",
      "City",
      "Pincode",
      "State",
      "Total Bookings",
      "Status",
      "Joined Date"
    ];

    const rows = filteredPatients.map(patient => [
      patient.patient_full_name || "",
      patient.patient_contact || "",
      patient.patient_email || "",
      patient.patient_address || "",
      patient.patient_city || "",
      patient.patient_pincode || "",
      patient.state || "",
      patient.total_bookings.toString(),
      patient.is_blocked ? "Blocked" : "Active",
      new Date(patient.created_at).toLocaleString()
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `patients_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get unique states from patients
  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    patients.forEach(patient => {
      if (patient.state) {
        states.add(patient.state);
      }
    });
    return Array.from(states).sort();
  }, [patients]);

  // Filter patients by state
  const filteredPatients = useMemo(() => {
    if (stateFilter === "all") {
      return patients;
    }
    return patients.filter(patient => patient.state === stateFilter);
  }, [patients, stateFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">Pending</span>;
      case "quote_sent":
        return <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">Quote Sent</span>;
      case "accepted":
        return <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">Accepted</span>;
      case "declined":
        return <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">Declined</span>;
      case "cancelled":
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Cancelled</span>;
      case "completed":
        return <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">Completed</span>;
      default:
        return <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          Total Patients: <span className="font-semibold text-gray-900">{filteredPatients.length}</span>
          {stateFilter !== "all" && (
            <span className="ml-2 text-gray-500">
              (filtered from {patients.length})
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* State Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All States</option>
              {uniqueStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* View All Orders Button */}
          <button
            onClick={handleViewAllOrders}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            View All Orders
          </button>

          {/* Download Excel Button */}
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Patient Name</th>
              <th className="text-left py-3 px-4">Contact</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Location</th>
              <th className="text-left py-3 px-4">Bookings</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Joined</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient) => (
              <tr key={patient.user_id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">
                    {patient.patient_full_name || "Not set"}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {patient.patient_contact ? (
                    <a
                      href={`tel:${patient.patient_contact}`}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {patient.patient_contact}
                    </a>
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {patient.patient_email ? (
                    <a
                      href={`mailto:${patient.patient_email}`}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      {patient.patient_email}
                    </a>
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {patient.patient_city && patient.patient_pincode ? (
                    <div className="text-sm">
                      <div className="font-medium">{patient.patient_city}</div>
                      <div className="text-gray-500">{patient.patient_pincode}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleViewBookings(patient)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    {patient.total_bookings}
                  </button>
                </td>
                <td className="py-3 px-4">
                  {patient.is_blocked ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                      <XCircle className="w-3 h-3" />
                      Blocked
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {new Date(patient.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  {canEdit ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProfile(patient)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Edit Profile"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleBlockPatient(patient.user_id, patient.is_blocked === 1)}
                        className={`p-2 rounded-lg transition-colors ${
                          patient.is_blocked
                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                            : "bg-orange-100 text-orange-600 hover:bg-orange-200"
                        }`}
                        title={patient.is_blocked ? "Unblock" : "Block"}
                      >
                        {patient.is_blocked ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeletePatient(patient.user_id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete Patient"
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
        {filteredPatients.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {stateFilter === "all" ? "No patients found" : `No patients found in ${stateFilter}`}
          </div>
        )}
      </div>

      {/* All Orders Modal */}
      {showAllOrdersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">All Patient Orders</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Viewing all service orders from all patients
                </p>
              </div>
              <button
                onClick={() => setShowAllOrdersModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingBookings ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading all orders...</p>
                </div>
              ) : allOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  No orders found
                </div>
              ) : (
                <div className="space-y-4">
                  {allOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {order.service_category || "Service Request"} - Order #{order.id}
                            </h4>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Patient:</strong> {order.patient_name} - {order.patient_contact}
                          </p>
                          {order.equipment_name && (
                            <p className="text-sm text-gray-600">
                              <strong>Equipment:</strong> {order.equipment_name}
                              {order.equipment_model && ` (${order.equipment_model})`}
                            </p>
                          )}
                        </div>
                        {canEdit && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingBooking(order);
                                setBookingEditForm({
                                  status: order.status || "",
                                  service_type: order.service_type || "",
                                  service_category: order.service_category || "",
                                  equipment_name: order.equipment_name || "",
                                  equipment_model: order.equipment_model || "",
                                  issue_description: order.issue_description || "",
                                  urgency_level: order.urgency_level || "",
                                  quoted_price: order.quoted_price?.toString() || "",
                                  engineer_notes: order.engineer_notes || "",
                                });
                                setShowEditBookingModal(true);
                              }}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                              title="Edit Order"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Issue:</span>
                          <p className="text-gray-900 mt-1">{order.issue_description}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Urgency:</span>
                          <p className="text-gray-900 mt-1 capitalize">{order.urgency_level}</p>
                        </div>
                        {order.partner_name || order.partner_business ? (
                          <div>
                            <span className="text-gray-600">Assigned Partner:</span>
                            <p className="text-gray-900 mt-1">
                              {order.partner_business || order.partner_name}
                            </p>
                          </div>
                        ) : null}
                        {order.quoted_price && (
                          <div>
                            <span className="text-gray-600">Quote:</span>
                            <p className="text-gray-900 mt-1 font-semibold">₹{order.quoted_price.toLocaleString()}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Location:</span>
                          <p className="text-gray-900 mt-1">{order.patient_location || "Not specified"}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Created:</span>
                          <p className="text-gray-900 mt-1">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAllOrdersModal(false)}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Modal */}
      {showBookingsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Patient Bookings</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedPatient.patient_full_name} - {selectedPatient.patient_contact}
                </p>
              </div>
              <button
                onClick={() => setShowBookingsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingBookings ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading bookings...</p>
                </div>
              ) : patientBookings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  No bookings found for this patient
                </div>
              ) : (
                <div className="space-y-4">
                  {patientBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {booking.service_category || "Service Request"}
                            </h4>
                            {getStatusBadge(booking.status)}
                          </div>
                          {booking.equipment_name && (
                            <p className="text-sm text-gray-600">
                              Equipment: {booking.equipment_name}
                              {booking.equipment_model && ` (${booking.equipment_model})`}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleEditBooking(booking)}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                title="Edit Booking"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBooking(booking.id)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                title="Delete Booking"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Issue:</span>
                          <p className="text-gray-900 mt-1">{booking.issue_description}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Urgency:</span>
                          <p className="text-gray-900 mt-1 capitalize">{booking.urgency_level}</p>
                        </div>
                        {booking.partner_name || booking.partner_business ? (
                          <div>
                            <span className="text-gray-600">Assigned Partner:</span>
                            <p className="text-gray-900 mt-1">
                              {booking.partner_business || booking.partner_name}
                            </p>
                          </div>
                        ) : null}
                        {booking.quoted_price && (
                          <div>
                            <span className="text-gray-600">Quote:</span>
                            <p className="text-gray-900 mt-1 font-semibold">₹{booking.quoted_price.toLocaleString()}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Created:</span>
                          <p className="text-gray-900 mt-1">
                            {new Date(booking.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowBookingsModal(false)}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Patient Profile</h2>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editForm.patient_full_name}
                    onChange={(e) => setEditForm({ ...editForm, patient_full_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter patient's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.patient_contact}
                    onChange={(e) => setEditForm({ ...editForm, patient_contact: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.patient_email}
                    onChange={(e) => setEditForm({ ...editForm, patient_email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={editForm.patient_address}
                    onChange={(e) => setEditForm({ ...editForm, patient_address: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={editForm.patient_city}
                      onChange={(e) => setEditForm({ ...editForm, patient_city: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={editForm.patient_pincode}
                      onChange={(e) => setEditForm({ ...editForm, patient_pincode: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="6-digit pincode"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditBookingModal && editingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Service Order</h2>
              <button
                onClick={() => setShowEditBookingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={bookingEditForm.status}
                    onChange={(e) => setBookingEditForm({ ...bookingEditForm, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="quote_sent">Quote Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="declined">Declined</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                    <input
                      type="text"
                      value={bookingEditForm.service_type}
                      onChange={(e) => setBookingEditForm({ ...bookingEditForm, service_type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Repair, Installation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Category</label>
                    <input
                      type="text"
                      value={bookingEditForm.service_category}
                      onChange={(e) => setBookingEditForm({ ...bookingEditForm, service_category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Biomedical Equipment"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Name</label>
                    <input
                      type="text"
                      value={bookingEditForm.equipment_name}
                      onChange={(e) => setBookingEditForm({ ...bookingEditForm, equipment_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Model</label>
                    <input
                      type="text"
                      value={bookingEditForm.equipment_model}
                      onChange={(e) => setBookingEditForm({ ...bookingEditForm, equipment_model: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issue Description</label>
                  <textarea
                    value={bookingEditForm.issue_description}
                    onChange={(e) => setBookingEditForm({ ...bookingEditForm, issue_description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                    <select
                      value={bookingEditForm.urgency_level}
                      onChange={(e) => setBookingEditForm({ ...bookingEditForm, urgency_level: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quoted Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bookingEditForm.quoted_price}
                      onChange={(e) => setBookingEditForm({ ...bookingEditForm, quoted_price: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Engineer Notes</label>
                  <textarea
                    value={bookingEditForm.engineer_notes}
                    onChange={(e) => setBookingEditForm({ ...bookingEditForm, engineer_notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Internal notes about the service"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditBookingModal(false)}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBooking}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
