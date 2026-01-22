import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@getmocha/users-service/react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import {
  Search,
  Plus,
  MapPin,
  DollarSign,
  Clock,
  Mail,
  Phone,
  User,
  Edit,
  Trash2,
} from "lucide-react";
import CreateServiceModal from "@/react-app/components/CreateServiceModal";
import EditServiceModal from "@/react-app/components/EditServiceModal";
import DeleteConfirmModal from "@/react-app/components/DeleteConfirmModal";

/* =========================
   Types
========================= */
interface Service {
  id: number | string;
  title: string;
  description: string;
  service_type: string;
  provider_name: string;
  provider_picture: string | null;
  price_range: string | null;
  location: string | null;
  availability: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  image_url: string | null;
  posted_by_user_id?: string;
}

/* =========================
   Constants
========================= */
const SERVICE_TYPES = [
  "Equipment Repair",
  "Equipment Calibration",
  "Equipment Installation",
  "Preventive Maintenance",
  "Technical Training",
  "Consulting",
  "Equipment Sales",
  "Spare Parts Supply",
  "Emergency Support",
  "Other",
];

/* =========================
   Component
========================= */
export default function Services() {
  const { user } = useAuth();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [contactService, setContactService] = useState<Service | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<string | number | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  useEffect(() => {
    if (user) {
      fetch("/api/users/me", { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (data.profile?.user_id) {
            setCurrentUserId(data.profile.user_id);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  /* =========================
     Data Fetch
  ========================= */
  const fetchServices = async () => {
    try {
      setLoading(true);
      const url = type
        ? `/api/services?type=${encodeURIComponent(type)}`
        : "/api/services";
      const res = await fetch(url);
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [type]);

  const handleDeleteService = async (serviceId: string | number) => {
    try {
      setDeletingServiceId(serviceId);
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setServiceToDelete(null);
        fetchServices();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete service");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("An error occurred while deleting the service");
    } finally {
      setDeletingServiceId(null);
    }
  };

  /* =========================
     Derived State
  ========================= */
  const filteredServices = useMemo(() => {
    const q = search.toLowerCase();
    return services.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [services, search]);

  /* =========================
     Render
  ========================= */
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto mb-20 lg:mb-0">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Services</h1>
            <p className="text-gray-600">
              Find professional services for biomedical equipment
            </p>
          </div>

          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium"
            >
              <Plus className="w-5 h-5" />
              Offer Service
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-4 py-3 border rounded-xl"
          >
            <option value="">All Service Types</option>
            {SERVICE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">Loading services...</div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow">
            No services found
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                {s.image_url && (
                  <img
                    src={s.image_url}
                    alt={s.title}
                    className="w-full h-48 object-cover"
                  />
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      {s.provider_picture ? (
                        <img
                          src={s.provider_picture}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{s.provider_name}</p>
                        <p className="text-xs text-gray-500">{s.service_type}</p>
                      </div>
                    </div>
                    
                    {currentUserId && currentUserId === s.posted_by_user_id && (
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingService(s);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit service"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setServiceToDelete(s);
                          }}
                          disabled={deletingServiceId === s.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete service"
                        >
                          {deletingServiceId === s.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {s.description}
                  </p>

                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    {s.price_range && (
                      <div className="flex gap-2">
                        <DollarSign className="w-4 h-4" />
                        {s.price_range}
                      </div>
                    )}
                    {s.location && (
                      <div className="flex gap-2">
                        <MapPin className="w-4 h-4" />
                        {s.location}
                      </div>
                    )}
                    {s.availability && (
                      <div className="flex gap-2">
                        <Clock className="w-4 h-4" />
                        {s.availability}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setContactService(s)}
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium"
                  >
                    Contact Provider
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateServiceModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            fetchServices();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingService && (
        <EditServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onSuccess={() => {
            setEditingService(null);
            fetchServices();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {serviceToDelete && (
        <DeleteConfirmModal
          isOpen={!!serviceToDelete}
          onClose={() => setServiceToDelete(null)}
          onConfirm={() => handleDeleteService(serviceToDelete.id)}
          title="Delete Service"
          message="Are you sure you want to delete this service?"
          itemName={serviceToDelete.title}
          isDeleting={deletingServiceId === serviceToDelete.id}
        />
      )}

      {/* Contact Modal */}
      {contactService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Contact Provider</h3>

            {contactService.contact_email && (
              <a
                href={`mailto:${contactService.contact_email}`}
                className="flex gap-2 text-blue-600 mb-2"
              >
                <Mail className="w-4 h-4" />
                {contactService.contact_email}
              </a>
            )}

            {contactService.contact_phone && (
              <a
                href={`tel:${contactService.contact_phone}`}
                className="flex gap-2 text-blue-600 mb-4"
              >
                <Phone className="w-4 h-4" />
                {contactService.contact_phone}
              </a>
            )}

            <button
              onClick={() => setContactService(null)}
              className="w-full py-2 bg-gray-100 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
