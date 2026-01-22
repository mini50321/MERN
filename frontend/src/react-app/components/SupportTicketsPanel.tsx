import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  CheckCircle,
  X,
  Send,
  Loader2,
  AlertCircle,
  MessageCircle,
  User,
  Package,
} from "lucide-react";

interface SupportTicket {
  id: number;
  user_id: string;
  booking_id: number | null;
  subject: string;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by_admin_id: number | null;
  user_name: string;
  user_email: string;
  booking_service_category: string | null;
  booking_service_type: string | null;
  booking_status: string | null;
}

interface SupportTicketsPanelProps {
  canEdit: boolean;
}

export default function SupportTicketsPanel({ canEdit }: SupportTicketsPanelProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/support-tickets");
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error("Error loading support tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.subject?.toLowerCase().includes(term) ||
          t.message?.toLowerCase().includes(term) ||
          t.user_name?.toLowerCase().includes(term) ||
          t.user_email?.toLowerCase().includes(term) ||
          t.id.toString().includes(term) ||
          t.booking_id?.toString().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredTickets(filtered);
  };

  const handleRespond = async (ticketId: number) => {
    if (!adminResponse.trim() || !canEdit) {
      alert("Please enter a response");
      return;
    }

    setIsResponding(true);
    try {
      const response = await fetch(`/api/admin/support-tickets/${ticketId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: adminResponse }),
      });

      if (response.ok) {
        setAdminResponse("");
        loadTickets();
        alert("Response sent successfully!");
      } else {
        alert("Failed to send response");
      }
    } catch (error) {
      console.error("Error responding to ticket:", error);
      alert("An error occurred");
    } finally {
      setIsResponding(false);
    }
  };

  const handleResolve = async (ticketId: number) => {
    if (!canEdit || !confirm("Mark this ticket as resolved?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/support-tickets/${ticketId}/resolve`, {
        method: "POST",
      });

      if (response.ok) {
        loadTickets();
        if (viewingTicket?.id === ticketId) {
          setViewingTicket(null);
        }
        alert("Ticket marked as resolved");
      } else {
        alert("Failed to resolve ticket");
      }
    } catch (error) {
      console.error("Error resolving ticket:", error);
      alert("An error occurred");
    }
  };

  const handleReopen = async (ticketId: number) => {
    if (!canEdit || !confirm("Reopen this ticket?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/support-tickets/${ticketId}/reopen`, {
        method: "POST",
      });

      if (response.ok) {
        loadTickets();
        alert("Ticket reopened");
      } else {
        alert("Failed to reopen ticket");
      }
    } catch (error) {
      console.error("Error reopening ticket:", error);
      alert("An error occurred");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: "bg-yellow-100 text-yellow-800 border-yellow-300",
      in_progress: "bg-blue-100 text-blue-800 border-blue-300",
      resolved: "bg-green-100 text-green-800 border-green-300",
      closed: "bg-gray-100 text-gray-800 border-gray-300",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold border ${
          styles[status] || "bg-gray-100 text-gray-800 border-gray-300"
        }`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading support tickets...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Total Tickets</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm text-yellow-700">Open</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.open}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-700">In Progress</div>
          <div className="text-2xl font-bold text-blue-900">{stats.in_progress}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-700">Resolved</div>
          <div className="text-2xl font-bold text-green-900">{stats.resolved}</div>
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
                placeholder="Search by ticket ID, user, subject, or booking ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto -mx-4 lg:mx-0">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 lg:py-3 px-3 lg:px-4 text-xs font-semibold text-gray-700">Ticket ID</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">User</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">Subject</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">Service</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm font-semibold text-blue-600">#{ticket.id}</span>
                  </td>
                  <td className="py-3 px-4">
                    {ticket.booking_id ? (
                      <span className="font-mono text-sm font-semibold text-purple-600">#{ticket.booking_id}</span>
                    ) : (
                      <span className="text-xs text-gray-400">General</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900">{ticket.user_name || "Unknown"}</div>
                    <div className="text-xs text-gray-500">{ticket.user_email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{ticket.subject}</div>
                  </td>
                  <td className="py-3 px-4">
                    {ticket.booking_service_category ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ticket.booking_service_category}</div>
                        <div className="text-xs text-gray-500">{ticket.booking_service_type}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(ticket.status)}</td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-900">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(ticket.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => {
                        setViewingTicket(ticket);
                        setAdminResponse("");
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTickets.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No support tickets found</p>
            </div>
          )}
        </div>
      </div>

      {/* View Ticket Modal */}
      {viewingTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Support Ticket #{viewingTicket.id}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {viewingTicket.booking_id && `Order #${viewingTicket.booking_id} • `}
                  {new Date(viewingTicket.created_at).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setViewingTicket(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* User Information */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    User Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium text-gray-900">{viewingTicket.user_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <a
                        href={`mailto:${viewingTicket.user_email}`}
                        className="ml-2 font-medium text-blue-600 hover:underline"
                      >
                        {viewingTicket.user_email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Booking Information */}
                {viewingTicket.booking_id && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Related Booking
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Order ID:</span>
                        <span className="ml-2 font-mono font-bold text-purple-600">
                          #{viewingTicket.booking_id}
                        </span>
                      </div>
                      {viewingTicket.booking_service_category && (
                        <div>
                          <span className="text-gray-600">Service:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {viewingTicket.booking_service_category} - {viewingTicket.booking_service_type}
                          </span>
                        </div>
                      )}
                      {viewingTicket.booking_status && (
                        <div>
                          <span className="text-gray-600">Booking Status:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {viewingTicket.booking_status.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Ticket Details */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Ticket Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Subject:</span>
                      <p className="mt-1 text-gray-900 font-semibold">{viewingTicket.subject}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Message:</span>
                      <p className="mt-1 text-gray-900 whitespace-pre-wrap">{viewingTicket.message}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Status:</span>
                      <div className="mt-1">{getStatusBadge(viewingTicket.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Admin Response */}
                {viewingTicket.admin_response && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Admin Response
                    </h3>
                    <p className="text-gray-900 whitespace-pre-wrap">{viewingTicket.admin_response}</p>
                    {viewingTicket.resolved_at && (
                      <p className="text-xs text-green-700 mt-2">
                        Resolved on {new Date(viewingTicket.resolved_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Respond Section - Only show for open/in_progress tickets */}
                {canEdit && viewingTicket.status !== "resolved" && viewingTicket.status !== "closed" && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      Send Response
                    </h3>
                    <textarea
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      rows={4}
                      placeholder="Type your response to the user..."
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between">
              <div className="flex gap-2">
                {canEdit && viewingTicket.status !== "resolved" && viewingTicket.status !== "closed" && (
                  <>
                    <button
                      onClick={() => handleRespond(viewingTicket.id)}
                      disabled={isResponding || !adminResponse.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isResponding ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Response
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleResolve(viewingTicket.id)}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Mark as Resolved
                    </button>
                  </>
                )}
                {canEdit && viewingTicket.status === "resolved" && (
                  <button
                    onClick={() => handleReopen(viewingTicket.id)}
                    className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-all"
                  >
                    Reopen Ticket
                  </button>
                )}
              </div>
              <button
                onClick={() => setViewingTicket(null)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
