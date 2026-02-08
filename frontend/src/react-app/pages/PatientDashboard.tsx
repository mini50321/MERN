import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { 
  Stethoscope, 
  User, 
  Settings, 
  Heart, 
  Activity,
  Package,
  Ambulance,
  Calendar,
  LogOut,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  DollarSign,
  HelpCircle,
  FileText,
  Shield,
  AlertCircle,
  Phone,
  MessageCircle,
  Mail
} from "lucide-react";
import ServiceBookingModal from "@/react-app/components/ServiceBookingModal";
import ServiceTypeSelectionModal from "@/react-app/components/ServiceTypeSelectionModal";
import LocationMapPicker from "@/react-app/components/LocationMapPicker";
import PhoneVerificationModal from "@/react-app/components/PhoneVerificationModal";
import TransactionHistoryView from "@/react-app/components/patient/TransactionHistoryView";
import HelpCenterView from "@/react-app/components/patient/HelpCenterView";
import TermsConditionsView from "@/react-app/components/patient/TermsConditionsView";
import PrivacyPolicyView from "@/react-app/components/patient/PrivacyPolicyView";
import PatientSearchingForPartner from "@/react-app/components/PatientSearchingForPartner";
import BookingSupportModal from "@/react-app/components/BookingSupportModal";
import { useToast } from "@/react-app/components/ToastContainer";
import { playPartnerAcceptSound, playOrderCompleteSound } from "@/react-app/utils/soundEffects";

export default function PatientDashboard() {
  const { user, redirectToLogin, isPending, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"services" | "bookings" | "settings">("services");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchingOrderId, setSearchingOrderId] = useState<number | null>(null);
  const { showNotification } = useToast();
  const lastNotificationIdRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check URL hash for searching order ID
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#searching-")) {
      const orderId = parseInt(hash.replace("#searching-", ""));
      if (!isNaN(orderId)) {
        setSearchingOrderId(orderId);
        setActiveTab("bookings");
        // Clear the hash
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const pollNotifications = async () => {
      try {
        const response = await fetch("/api/notifications?unread=true");
        if (response.ok) {
          const notifications = await response.json();
          
          const newNotifications = notifications.filter((n: any) => {
            if (lastNotificationIdRef.current === null) {
              return false;
            }
            return n.id > (lastNotificationIdRef.current || 0);
          });

          if (notifications.length > 0) {
            const maxId = Math.max(...notifications.map((n: any) => n.id));
            if (maxId > (lastNotificationIdRef.current || 0)) {
              lastNotificationIdRef.current = maxId;
            }
          }

          for (const notification of newNotifications) {
            showNotification(notification.title, notification.message, notification.type);
            
            fetch(`/api/notifications/${notification.id}/read`, { method: "POST" }).catch(console.error);
          }
        }
      } catch (error) {
        console.error("Error polling notifications:", error);
      }
    };

    const initializeNotifications = async () => {
      try {
        const response = await fetch("/api/notifications?unread=true");
        if (response.ok) {
          const notifications = await response.json();
          if (notifications.length > 0) {
            const maxId = Math.max(...notifications.map((n: any) => n.id));
            lastNotificationIdRef.current = maxId;
          } else {
            lastNotificationIdRef.current = 0;
          }
        }
      } catch (error) {
        console.error("Error initializing notifications:", error);
        lastNotificationIdRef.current = 0;
      }
    };

    initializeNotifications();

    pollingIntervalRef.current = setInterval(pollNotifications, 10000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [user, showNotification]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    redirectToLogin();
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Mavy App</h1>
                <p className="text-xs text-teal-100">Connecting You to Healthcare Professionals</p>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-3 hover:bg-white/10 rounded-xl px-3 py-2 transition-colors"
              >
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-semibold">{user.google_user_data?.name || "User"}</div>
                  <div className="text-xs text-teal-100">Patient</div>
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
                  <ProfileDropdown onClose={() => setShowProfileDropdown(false)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("services")}
              className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                activeTab === "services"
                  ? "text-teal-600 border-teal-600"
                  : "text-gray-600 border-transparent hover:text-teal-600"
              }`}
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                activeTab === "bookings"
                  ? "text-teal-600 border-teal-600"
                  : "text-gray-600 border-transparent hover:text-teal-600"
              }`}
            >
              My Bookings
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                activeTab === "settings"
                  ? "text-teal-600 border-teal-600"
                  : "text-gray-600 border-transparent hover:text-teal-600"
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "services" && <ServicesTab />}
        {activeTab === "bookings" && <BookingsTab />}
        {activeTab === "settings" && <SettingsTab onLogout={async () => { await logout(); window.location.href = "/"; }} />}
      </div>

      {/* Searching Modal Overlay */}
      {searchingOrderId && (
        <PatientSearchingForPartner
          orderId={searchingOrderId}
          onClose={() => {
            setSearchingOrderId(null);
            setActiveTab("bookings");
          }}
        />
      )}
    </div>
  );
}

function ServicesTab() {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<any>(null);
  
  const handleServiceClick = (service: any) => {
    setSelectedService(service);
    
    // For Equipment Rental, skip type selection and go directly to booking
    if (service.id === 5 || service.title === "Equipment Rental") {
      setSelectedServiceType({ name: "Equipment Rental", description: "Rent medical equipment for home care" });
    } else {
      setShowTypeSelection(true);
    }
  };

  const handleTypeSelect = (type: any) => {
    setSelectedServiceType(type);
    setShowTypeSelection(false);
    // Service is already set, now we have the type too
  };

  const handleCloseBooking = () => {
    setSelectedService(null);
    setSelectedServiceType(null);
  };
  
  const services = [
    {
      id: 1,
      title: "Biomedical Engineering",
      description: "Connect with certified biomedical engineers",
      icon: <Activity className="w-12 h-12" />,
      gradient: "from-blue-400 to-blue-600",
      iconBg: "from-blue-100 to-blue-200"
    },
    {
      id: 2,
      title: "Nursing Services",
      description: "Find qualified nursing professionals",
      icon: <Heart className="w-12 h-12" />,
      gradient: "from-pink-400 to-rose-600",
      iconBg: "from-pink-100 to-pink-200"
    },
    {
      id: 3,
      title: "Physiotherapy",
      description: "Book expert physiotherapists",
      icon: <Stethoscope className="w-12 h-12" />,
      gradient: "from-purple-400 to-purple-600",
      iconBg: "from-purple-100 to-purple-200"
    },
    {
      id: 4,
      title: "Ambulance Services",
      description: "Request emergency and non-emergency ambulances",
      icon: <Ambulance className="w-12 h-12" />,
      gradient: "from-red-400 to-red-600",
      iconBg: "from-red-100 to-red-200"
    },
    {
      id: 5,
      title: "Equipment Rental",
      description: "Rent medical equipment for home care",
      icon: <Package className="w-12 h-12" />,
      gradient: "from-orange-400 to-amber-600",
      iconBg: "from-orange-100 to-amber-200"
    }
  ];

  const comingSoonServices = [
    {
      id: 101,
      title: "Pharmacy",
      description: "Order medicines online",
      icon: "💊",
      gradient: "from-green-400 to-emerald-600"
    },
    {
      id: 102,
      title: "Labs",
      description: "Book diagnostic tests at home",
      icon: "🔬",
      gradient: "from-indigo-400 to-violet-600"
    },
    {
      id: 103,
      title: "Doctor Consultation",
      description: "Connect with doctors online",
      icon: "👨‍⚕️",
      gradient: "from-cyan-400 to-sky-600"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Services Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Healthcare Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} onClick={() => handleServiceClick(service)} />
          ))}
        </div>
      </div>

      {/* Coming Soon Services */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Coming Soon</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comingSoonServices.map((service) => (
            <ComingSoonServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
      
      {/* Service Type Selection Modal */}
      {selectedService && showTypeSelection && (
        <ServiceTypeSelectionModal
          isOpen={showTypeSelection}
          onClose={() => {
            setShowTypeSelection(false);
            setSelectedService(null);
          }}
          service={selectedService}
          onSelectType={handleTypeSelect}
        />
      )}
      
      {/* Booking Modal */}
      {selectedService && selectedServiceType && (
        <ServiceBookingModal
          isOpen={!!selectedServiceType}
          onClose={handleCloseBooking}
          service={selectedService}
          serviceType={selectedServiceType}
        />
      )}
    </div>
  );
}

function ServiceCard({ service, onClick }: { service: any; onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border-2 border-transparent hover:border-teal-500">
      <div className={`h-40 bg-gradient-to-br ${service.iconBg} flex items-center justify-center relative overflow-hidden`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
        <div className={`relative z-10 text-${service.gradient.split('-')[1]}-600 group-hover:scale-110 transition-transform duration-300`}>
          {service.icon}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{service.description}</p>
        <div className={`w-full px-4 py-2 bg-gradient-to-r ${service.gradient} text-white rounded-lg font-semibold hover:shadow-lg transition-all text-center`}>
          Request Service
        </div>
      </div>
    </div>
  );
}

function ComingSoonServiceCard({ service }: { service: any }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200 opacity-75 cursor-not-allowed">
      <div className={`h-40 bg-gradient-to-br ${service.gradient} flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 bg-white opacity-40" />
        <div className="relative z-10 text-6xl">
          {service.icon}
        </div>
        <div className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          COMING SOON
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{service.description}</p>
        <div className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-lg font-semibold text-center cursor-not-allowed">
          Coming Soon
        </div>
      </div>
    </div>
  );
}

function BookingsTab() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"active" | "completed" | "cancelled">("active");
  const [previousBookings, setPreviousBookings] = useState<any[]>([]);
  const [supportBooking, setSupportBooking] = useState<any>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    loadBookings(true); 
    
    const interval = setInterval(() => {
      loadBookings(false); 
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const activeBookings = bookings.filter(b => 
    ["pending", "quote_sent", "accepted", "in_progress", "confirmed"].includes(b.status)
  );
  const completedBookings = bookings.filter(b => b.status === "completed");
  const cancelledBookings = bookings.filter(b => 
    ["cancelled", "declined"].includes(b.status)
  );

  const filteredBookings = activeFilter === "active" 
    ? activeBookings 
    : activeFilter === "completed" 
    ? completedBookings 
    : cancelledBookings;

  const loadBookings = async (showLoading = false) => {
    if (showLoading && isInitialLoadRef.current) {
      setIsLoading(true);
    }
    
    try {
      const response = await fetch("/api/patient/bookings");
      if (response.ok) {
        const data = await response.json();
        
        if (previousBookings.length > 0) {
          data.forEach((newBooking: any) => {
            const oldBooking = previousBookings.find((b: any) => b.id === newBooking.id);
            
            if (oldBooking && oldBooking.status !== newBooking.status) {
              if (newBooking.status === "accepted" && oldBooking.status !== "accepted") {
                playPartnerAcceptSound();
              } else if (newBooking.status === "completed" && oldBooking.status !== "completed") {
                playOrderCompleteSound();
              }
            }
          });
        }
        
        setPreviousBookings(data);
        setBookings(data);
        
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
        }
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      if (showLoading && isLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleAcceptQuote = async (bookingId: number) => {
    try {
      const response = await fetch(`/api/patient/bookings/${bookingId}/accept`, {
        method: "POST"
      });
      if (response.ok) {
        loadBookings(false); 
      }
    } catch (error) {
      console.error("Error accepting quote:", error);
    }
  };

  const handleDeclineQuote = async (bookingId: number) => {
    try {
      const response = await fetch(`/api/patient/bookings/${bookingId}/decline`, {
        method: "POST"
      });
      if (response.ok) {
        loadBookings(false); 
      }
    } catch (error) {
      console.error("Error declining quote:", error);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      const response = await fetch(`/api/patient/bookings/${bookingId}/cancel`, {
        method: "POST"
      });
      if (response.ok) {
        loadBookings(false); 
      } else {
        const data = await response.json();
        alert(data.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking");
    }
  };

  const handleRateService = (booking: any) => {
    setSelectedBooking(booking);
    setShowRatingModal(true);
    setRating(0);
    setReview("");
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    setIsSubmittingRating(true);
    try {
      const response = await fetch(`/api/patient/bookings/${selectedBooking.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, review })
      });

      if (response.ok) {
        setShowRatingModal(false);
        loadBookings(false); 
      } else {
        alert("Failed to submit rating");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h2>
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
          <p className="text-gray-600">
            You haven't made any service bookings yet. Use the Services tab above to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h2>
      
      {/* Booking Status Filter Tabs */}
      <div className="bg-white rounded-xl shadow-md mb-6 p-1.5 flex gap-1">
        <button
          onClick={() => setActiveFilter("active")}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            activeFilter === "active"
              ? "bg-teal-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Activity className="w-4 h-4" />
          Active
          {activeBookings.length > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              activeFilter === "active" ? "bg-white/20 text-white" : "bg-teal-100 text-teal-700"
            }`}>
              {activeBookings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveFilter("completed")}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            activeFilter === "completed"
              ? "bg-green-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Completed
          {completedBookings.length > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              activeFilter === "completed" ? "bg-white/20 text-white" : "bg-green-100 text-green-700"
            }`}>
              {completedBookings.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveFilter("cancelled")}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            activeFilter === "cancelled"
              ? "bg-gray-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <XCircle className="w-4 h-4" />
          Cancelled
          {cancelledBookings.length > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              activeFilter === "cancelled" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
            }`}>
              {cancelledBookings.length}
            </span>
          )}
        </button>
      </div>

      {/* Empty State for Current Filter */}
      {filteredBookings.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-200">
          {activeFilter === "active" && (
            <>
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Active Bookings</h3>
              <p className="text-gray-600 text-sm">You don't have any active bookings at the moment.</p>
            </>
          )}
          {activeFilter === "completed" && (
            <>
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Completed Bookings</h3>
              <p className="text-gray-600 text-sm">Your completed bookings will appear here.</p>
            </>
          )}
          {activeFilter === "cancelled" && (
            <>
              <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Cancelled Bookings</h3>
              <p className="text-gray-600 text-sm">You haven't cancelled any bookings.</p>
            </>
          )}
        </div>
      )}
      
      <div className="space-y-6">
        {filteredBookings.map((booking) => {
          // Determine service icon and color based on category
          const getServiceStyle = () => {
            const category = booking.service_category?.toLowerCase() || "";
            if (category.includes("biomedical") || category.includes("engineering")) {
              return { icon: <Activity className="w-6 h-6" />, gradient: "from-blue-500 to-blue-600", bg: "bg-blue-500", light: "bg-blue-50", border: "border-l-blue-500" };
            } else if (category.includes("nursing")) {
              return { icon: <Heart className="w-6 h-6" />, gradient: "from-pink-500 to-rose-500", bg: "bg-pink-500", light: "bg-pink-50", border: "border-l-pink-500" };
            } else if (category.includes("physio")) {
              return { icon: <Stethoscope className="w-6 h-6" />, gradient: "from-purple-500 to-purple-600", bg: "bg-purple-500", light: "bg-purple-50", border: "border-l-purple-500" };
            } else if (category.includes("ambulance")) {
              return { icon: <Ambulance className="w-6 h-6" />, gradient: "from-red-500 to-red-600", bg: "bg-red-500", light: "bg-red-50", border: "border-l-red-500" };
            } else if (category.includes("equipment") || category.includes("rental")) {
              return { icon: <Package className="w-6 h-6" />, gradient: "from-orange-500 to-amber-500", bg: "bg-orange-500", light: "bg-orange-50", border: "border-l-orange-500" };
            }
            return { icon: <Activity className="w-6 h-6" />, gradient: "from-teal-500 to-cyan-500", bg: "bg-teal-500", light: "bg-teal-50", border: "border-l-teal-500" };
          };
          
          const serviceStyle = getServiceStyle();
          
          return (
          <div key={booking.id} className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 hover:shadow-xl transition-shadow border-l-4 ${serviceStyle.border}`}>
            {/* Colored Header Strip */}
            <div className={`bg-gradient-to-r ${serviceStyle.gradient} px-6 py-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                    {serviceStyle.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{booking.service_category}</h3>
                    <p className="text-sm text-white/80">{booking.service_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-1">
                    <span className="text-white font-bold text-sm">Order #{booking.id}</span>
                  </div>
                  <p className="text-xs text-white/80 flex items-center gap-1 justify-end">
                    <Calendar className="w-3 h-3" />
                    {new Date(booking.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Status Badge Bar */}
            <div className={`px-6 py-4 ${serviceStyle.light} border-b border-gray-200`}>
              <div className="flex items-center justify-between">
                {/* Animated Status Badge */}
                {booking.status === "pending" ? (
                  <div className="flex-1">
                    {/* Large animated searching indicator */}
                    <div className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-4 shadow-lg overflow-hidden">
                      {/* Animated background shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                      
                      <div className="relative flex items-center gap-4">
                        {/* Large pulsing icon with multiple rings */}
                        <div className="relative flex-shrink-0">
                          {/* Outer ring - largest */}
                          <div className="absolute -inset-4 bg-white rounded-full opacity-20 animate-ping" style={{ animationDuration: '2s' }}></div>
                          {/* Middle ring */}
                          <div className="absolute -inset-2 bg-white rounded-full opacity-30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }}></div>
                          {/* Inner ring */}
                          <div className="absolute inset-0 bg-white rounded-full opacity-40 animate-ping" style={{ animationDuration: '1s', animationDelay: '0.6s' }}></div>
                          {/* Center icon with glow */}
                          <div className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl">
                            <MapPin className="w-7 h-7 text-orange-600 animate-bounce" />
                          </div>
                        </div>

                        {/* Text content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-black text-white mb-1 drop-shadow-md">
                            🔍 Searching for partner nearby...
                          </h4>
                          <p className="text-sm text-white/90 font-medium">
                            Finding the best service provider for you
                          </p>
                        </div>
                      </div>

                      {/* Animated progress bar */}
                      <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full animate-pulse shadow-lg" style={{ 
                          width: '75%',
                          animation: 'pulse 1.5s ease-in-out infinite'
                        }}></div>
                      </div>
                    </div>
                  </div>
                ) : (booking.status === "accepted" || booking.status === "in_progress" || booking.status === "confirmed") ? (
                  <div className="flex-1">
                    {/* Large animated ongoing indicator */}
                    <div className="relative bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-2xl p-4 shadow-lg overflow-hidden">
                      {/* Animated flowing background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
                      
                      <div className="relative flex items-center gap-4">
                        {/* Rotating activity icon */}
                        <div className="relative flex-shrink-0">
                          {/* Rotating outer ring */}
                          <div className="absolute -inset-3 border-4 border-white border-t-transparent rounded-full opacity-30 animate-spin" style={{ animationDuration: '2s' }}></div>
                          {/* Rotating inner ring - opposite direction */}
                          <div className="absolute -inset-1 border-3 border-white border-b-transparent rounded-full opacity-40" style={{ animation: 'spin 1.5s linear infinite reverse' }}></div>
                          {/* Center icon with pulse */}
                          <div className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                            <Activity className="w-7 h-7 text-cyan-600" />
                          </div>
                        </div>

                        {/* Text content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-black text-white mb-1 drop-shadow-md">
                            {booking.status === "in_progress" ? "⚡ Service in Progress" : 
                             booking.status === "confirmed" ? "✅ Partner Confirmed" :
                             "✅ Partner Assigned"}
                          </h4>
                          <p className="text-sm text-white/90 font-medium">
                            {booking.status === "in_progress" ? "Your service is currently being provided" :
                             "Your service partner is ready"}
                          </p>
                        </div>
                      </div>

                      {/* Animated progress dots */}
                      <div className="mt-3 flex gap-2 justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                    booking.status === "quote_sent" ? "bg-purple-500 text-white" :
                    booking.status === "declined" ? "bg-red-500 text-white" :
                    booking.status === "completed" ? "bg-green-500 text-white" :
                    booking.status === "cancelled" ? "bg-gray-500 text-white" :
                    "bg-gray-500 text-white"
                  }`}>
                    {booking.status === "quote_sent" ? "📩 Quote Received" :
                     booking.status === "completed" ? "✓ Completed" :
                     booking.status === "cancelled" ? "✕ Cancelled" :
                     booking.status === "declined" ? "✕ Declined" :
                     booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                )}
                {booking.quoted_price && (
                  <span className="text-lg font-bold text-gray-900">₹{booking.quoted_price}</span>
                )}
              </div>
            </div>
            
            {/* Card Body */}
            <div className="p-6">

            {/* Complete Booking Details Grid */}
            <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                Booking Details
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Service Type */}
                <div className="flex items-start gap-2">
                  <Stethoscope className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Service Type</p>
                    <p className="text-sm font-semibold text-gray-900">{booking.service_type}</p>
                  </div>
                </div>

                {/* Equipment (if applicable) */}
                {booking.equipment_name && (
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">Equipment</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {booking.equipment_name}
                        {booking.equipment_model && <span className="text-gray-600 font-normal"> ({booking.equipment_model})</span>}
                      </p>
                    </div>
                  </div>
                )}

                {/* Scheduled Date/Time */}
                {booking.preferred_date && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">Scheduled Date</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(booking.preferred_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {booking.preferred_time && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">Scheduled Time</p>
                      <p className="text-sm font-semibold text-gray-900">{booking.preferred_time}</p>
                    </div>
                  </div>
                )}

                {/* Urgency Level */}
                {booking.urgency_level && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">Urgency</p>
                      <p className={`text-sm font-semibold ${
                        booking.urgency_level === 'emergency' || booking.urgency_level === 'urgent' 
                          ? 'text-red-600' 
                          : 'text-gray-900'
                      }`}>
                        {booking.urgency_level.charAt(0).toUpperCase() + booking.urgency_level.slice(1)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Billing Frequency */}
                {booking.billing_frequency && (
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">Billing Type</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {booking.billing_frequency === 'monthly' 
                          ? `Monthly (${booking.monthly_visits_count || 30} visits)` 
                          : 'Per Visit'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location */}
                {(booking.patient_city || booking.patient_address) && (
                  <div className="flex items-start gap-2 md:col-span-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">Service Location</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {[booking.patient_address, booking.patient_city, booking.patient_pincode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Service Requirement */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-gray-600 font-semibold mb-2">Service Requirement</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{booking.issue_description}</p>
            </div>

            {/* Quote Information */}
            {booking.status === "quote_sent" && booking.quoted_price && (
              <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Quote Received</p>
                    <p className="text-2xl font-bold text-green-700 flex items-center gap-1">
                      <DollarSign className="w-6 h-6" />
                      ₹{booking.quoted_price}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Service Type</p>
                    <p className="text-sm font-semibold text-gray-900">{booking.service_type}</p>
                  </div>
                </div>
                {booking.engineer_notes && (
                  <div className="mb-3 p-2 bg-white rounded border border-green-200">
                    <p className="text-xs text-gray-600 mb-1">Partner Notes:</p>
                    <p className="text-sm text-gray-700">{booking.engineer_notes}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAcceptQuote(booking.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Accept Quote
                  </button>
                  <button
                    onClick={() => handleDeclineQuote(booking.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    Decline
                  </button>
                </div>
              </div>
            )}

            {/* Accepted Status with Partner Contact Details */}
            {booking.status === "accepted" && (
              <div className="mb-4 space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <p className="font-semibold text-blue-900">Quote Accepted</p>
                  </div>
                  <p className="text-sm text-gray-700">
                    Service Amount: <span className="font-bold text-blue-700">₹{booking.quoted_price}</span>
                  </p>
                </div>

                {/* Partner Contact Information */}
                {booking.partner_name && (
                  <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-teal-600" />
                        <h4 className="font-semibold text-teal-900">Partner Contact Details</h4>
                      </div>
                      
                      {/* Partner Rating Badge */}
                      {booking.partner_avg_rating && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 border border-yellow-300 rounded-full">
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            <span className="text-sm font-bold text-yellow-800">{booking.partner_avg_rating}/5</span>
                          </div>
                          <div className="px-3 py-1.5 bg-blue-100 border border-blue-300 rounded-full">
                            <span className="text-sm font-bold text-blue-800">{booking.partner_completed_orders} orders</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Show rating info text if available */}
                    {booking.partner_completed_orders > 0 && (
                      <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <p className="text-xs text-green-800">
                          Trusted partner with <strong>{booking.partner_completed_orders} completed orders</strong>
                          {booking.partner_avg_rating && <> and <strong>{booking.partner_avg_rating}★</strong> average rating from {booking.partner_total_ratings} reviews</>}
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 font-medium w-24">Name:</span>
                        <span className="text-gray-900 font-semibold">{booking.partner_name}</span>
                      </div>
                      
                      {booking.partner_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600 font-medium w-24">Phone:</span>
                          <a 
                            href={`tel:${booking.partner_phone}`}
                            className="text-teal-600 font-semibold hover:underline"
                          >
                            {booking.partner_phone}
                          </a>
                        </div>
                      )}
                      
                      {booking.partner_email && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600 font-medium w-24">Email:</span>
                          <a 
                            href={`mailto:${booking.partner_email}`}
                            className="text-teal-600 font-semibold hover:underline break-all"
                          >
                            {booking.partner_email}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-teal-700 mt-3 bg-teal-100 p-2 rounded">
                      💡 The partner has your contact details and will reach out to schedule the service.
                    </p>
                    
                    {/* Action Buttons - Call & WhatsApp */}
                    {booking.partner_phone && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <a
                          href={`tel:${booking.partner_phone}`}
                          className="flex flex-col items-center gap-2 p-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-md hover:shadow-lg"
                        >
                          <Phone className="w-6 h-6" />
                          <span className="text-sm font-semibold">Call Partner</span>
                        </a>
                        
                        <a
                          href={`https://wa.me/91${booking.partner_phone.replace(/\D/g, '').slice(-10)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-2 p-4 bg-[#25D366] text-white rounded-xl hover:bg-[#1fb855] transition-all shadow-md hover:shadow-lg"
                        >
                          <MessageCircle className="w-6 h-6" />
                          <span className="text-sm font-semibold">WhatsApp</span>
                        </a>
                      </div>
                    )}
                    
                    {/* Partner Location Info */}
                    {(booking.partner_city || booking.partner_location) && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-teal-800">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {[booking.partner_location, booking.partner_city, booking.partner_state]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Completed Status - Show Rating Option */}
            {booking.status === "completed" && !booking.partner_rating && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-900">Service Completed</p>
                </div>
                <button
                  onClick={() => handleRateService(booking)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Star className="w-5 h-5" />
                  Rate This Service
                </button>
              </div>
            )}

            {/* Rating Already Submitted */}
            {booking.status === "completed" && booking.partner_rating && (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-semibold text-gray-900 mb-2">Your Rating</p>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= booking.partner_rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm font-semibold text-gray-700">
                    ({booking.partner_rating}/5)
                  </span>
                </div>
                {booking.partner_review && (
                  <p className="text-sm text-gray-700 italic">"{booking.partner_review}"</p>
                )}
              </div>
            )}

            {/* Partner's Review of Patient */}
            {booking.status === "completed" && booking.user_rating && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-gray-900 mb-2">Partner's Review</p>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= booking.user_rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm font-semibold text-gray-700">
                    ({booking.user_rating}/5)
                  </span>
                </div>
                {booking.user_review && (
                  <p className="text-sm text-gray-700 italic">"{booking.user_review}"</p>
                )}
              </div>
            )}

            {/* Preferred Schedule */}
            {(booking.preferred_date || booking.preferred_time) && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {booking.preferred_date && (
                    <span>
                      {new Date(booking.preferred_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  )}
                  {booking.preferred_time && <span> at {booking.preferred_time}</span>}
                </div>
              </div>
            )}

            {/* Help/Support Button - Show for all statuses */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setSupportBooking(booking)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <HelpCircle className="w-5 h-5" />
                Need Help with this Order?
              </button>
            </div>

            {/* Cancel Button - Show for all active bookings */}
            {["pending", "quote_sent", "accepted", "confirmed", "in_progress"].includes(booking.status) && (
              <div className="mt-3">
                <button
                  onClick={() => handleCancelBooking(booking.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 border-2 border-red-200 rounded-lg font-semibold hover:bg-red-100 transition-all"
                >
                  <XCircle className="w-5 h-5" />
                  Cancel Booking
                </button>
              </div>
            )}
            </div>
          </div>
        );
        })}
      </div>

      {/* Support Modal */}
      {supportBooking && (
        <BookingSupportModal
          booking={supportBooking}
          isOpen={!!supportBooking}
          onClose={() => setSupportBooking(null)}
          onSuccess={() => {
            setSupportBooking(null);
            alert("Support ticket submitted! Our team will respond soon.");
          }}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Rate Your Experience</h3>
              <button
                onClick={() => setShowRatingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">How was your experience with the service?</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm font-semibold text-gray-700">
                {rating === 0 ? "Select a rating" :
                 rating === 1 ? "Poor" :
                 rating === 2 ? "Fair" :
                 rating === 3 ? "Good" :
                 rating === 4 ? "Very Good" :
                 "Excellent"}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review (Optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                placeholder="Share your experience..."
              />
            </div>

            <button
              onClick={handleSubmitRating}
              disabled={isSubmittingRating || rating === 0}
              className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingRating ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileDropdown({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    patient_full_name: "",
    patient_contact: "",
    patient_email: "",
    patient_address: "",
    patient_city: "",
    patient_pincode: "",
    patient_latitude: null as number | null,
    patient_longitude: null as number | null
  });
  const [originalData, setOriginalData] = useState({
    patient_full_name: "",
    patient_contact: "",
    patient_email: "",
    patient_address: "",
    patient_city: "",
    patient_pincode: "",
    patient_latitude: null as number | null,
    patient_longitude: null as number | null
  });
  const [originalPhone, setOriginalPhone] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState(""); // Track which phone was actually verified
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [verificationError, setVerificationError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch("/api/users/me");
      if (response.ok) {
        const data = await response.json();
        const profile = data.profile;
        if (profile) {
          const phoneNumber = profile.patient_contact || profile.phone || "";
          const email = profile.email || profile.patient_email || "";
          const loadedData = {
            patient_full_name: profile.patient_full_name || profile.full_name || "",
            patient_contact: phoneNumber,
            patient_email: email,
            patient_address: profile.patient_address || profile.location || "",
            patient_city: profile.patient_city || profile.city || "",
            patient_pincode: profile.patient_pincode || profile.pincode || "",
            patient_latitude: profile.patient_latitude || profile.latitude || null,
            patient_longitude: profile.patient_longitude || profile.longitude || null
          };
          setProfileData(loadedData);
          setOriginalData(loadedData);
          setOriginalPhone(phoneNumber);
          setIsPhoneVerified(!!phoneNumber);
          setVerifiedPhone(phoneNumber);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    
    // Update profile data
    setProfileData(prev => ({
      ...prev,
      patient_contact: newPhone
    }));
    
    // Any change to phone number requires new verification
    // Only consider verified if it matches the already verified phone
    if (newPhone === verifiedPhone && newPhone.trim() !== "") {
      setIsPhoneVerified(true);
      setVerificationError("");
    } else {
      setIsPhoneVerified(false);
      setVerificationError("");
    }
  };

  const handleVerifyPhone = () => {
    const cleanPhone = profileData.patient_contact.replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    
    if (!phoneRegex.test(cleanPhone)) {
      setVerificationError("Please enter a valid Indian phone number (10 digits starting with 6-9)");
      return;
    }

    setVerificationError("");
    setShowPhoneVerification(true);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setProfileData({
      ...profileData,
      patient_latitude: lat,
      patient_longitude: lng
    });
  };

  const handleSaveProfile = async () => {
    const hasPhone = profileData.patient_contact && profileData.patient_contact.trim() !== "";
    const phoneNeedsVerification = hasPhone && profileData.patient_contact !== verifiedPhone;

    // Require verification if phone is new or changed and doesn't match verified phone
    if (phoneNeedsVerification) {
      setVerificationError("Please verify your phone number before saving");
      setSaveStatus("error");
      return;
    }

    setIsSaving(true);
    setSaveStatus("idle");
    setVerificationError("");

    try {
      const response = await fetch("/api/patient/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        setSaveStatus("success");
        setOriginalPhone(profileData.patient_contact);
        setIsPhoneVerified(true);
        // Reload profile data from server to ensure we have the latest data
        await loadProfile();
        setTimeout(() => {
          setSaveStatus("idle");
          onClose();
        }, 1500);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhoneVerified = () => {
    setShowPhoneVerification(false);
    setIsPhoneVerified(true);
    setVerifiedPhone(profileData.patient_contact); // Mark this specific phone as verified
    setVerificationError("");
  };

  const handleCancelEdit = () => {
    setProfileData(originalData);
    setIsEditing(false);
    setVerificationError("");
    setSaveStatus("idle");
    // Reset verified phone to original saved phone
    setVerifiedPhone(originalPhone);
    setIsPhoneVerified(!!originalPhone);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-4">
        <h3 className="text-lg font-bold text-gray-900">My Profile</h3>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-all text-sm"
            >
              Edit Profile
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      {saveStatus === "success" && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          Profile updated successfully!
        </div>
      )}

      {saveStatus === "error" && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          Failed to update profile. Please try again.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          {isEditing ? (
            <input
              type="text"
              value={profileData.patient_full_name}
              onChange={(e) => setProfileData({ ...profileData, patient_full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              placeholder="Enter your name"
            />
          ) : (
            <div className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-900 min-h-[42px] flex items-center">
              {profileData.patient_full_name || <span className="text-gray-400">Not set</span>}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            Contact Number
            {isPhoneVerified && profileData.patient_contact === verifiedPhone && profileData.patient_contact.trim() !== "" && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            )}
          </label>
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="tel"
                value={profileData.patient_contact}
                onChange={handlePhoneChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                placeholder="10-digit mobile number"
                maxLength={15}
              />
              {profileData.patient_contact.trim() !== "" && profileData.patient_contact !== verifiedPhone && (
                <button
                  type="button"
                  onClick={handleVerifyPhone}
                  className="px-3 py-2 rounded-lg font-semibold transition-all whitespace-nowrap text-sm bg-teal-600 text-white hover:bg-teal-700"
                >
                  Verify OTP
                </button>
              )}
              {profileData.patient_contact.trim() !== "" && profileData.patient_contact === verifiedPhone && (
                <span className="px-3 py-2 rounded-lg font-semibold text-sm bg-green-100 text-green-700 border-2 border-green-300 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                </span>
              )}
            </div>
          ) : (
            <div className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-900 min-h-[42px] flex items-center">
              {profileData.patient_contact || <span className="text-gray-400">Not set</span>}
            </div>
          )}
          {verificationError && (
            <p className="text-xs text-red-600 mt-1">{verificationError}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-xs text-gray-500">(from login)</span>
          </label>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-gray-900 border border-gray-200 text-sm">
            <Mail className="w-4 h-4 text-gray-500" />
            <span className="truncate">{(user as any)?.profile?.email || (user as any)?.profile?.patient_email || profileData.patient_email || (user as any)?.google_user_data?.email || (user as any)?.email || "Not available"}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">This email cannot be changed as it's linked to your login account</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          {isEditing ? (
            <input
              type="text"
              value={profileData.patient_address}
              onChange={(e) => setProfileData({ ...profileData, patient_address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              placeholder="Street address"
            />
          ) : (
            <div className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-900 min-h-[42px] flex items-center">
              {profileData.patient_address || <span className="text-gray-400">Not set</span>}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.patient_city}
                onChange={(e) => setProfileData({ ...profileData, patient_city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                placeholder="City"
              />
            ) : (
              <div className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-900 min-h-[42px] flex items-center">
                {profileData.patient_city || <span className="text-gray-400">Not set</span>}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PIN Code</label>
            {isEditing ? (
              <input
                type="text"
                value={profileData.patient_pincode}
                onChange={(e) => setProfileData({ ...profileData, patient_pincode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                placeholder="123456"
              />
            ) : (
              <div className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-900 min-h-[42px] flex items-center">
                {profileData.patient_pincode || <span className="text-gray-400">Not set</span>}
              </div>
            )}
          </div>
        </div>
        {isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Mark Your Location
            </label>
            <LocationMapPicker
              latitude={profileData.patient_latitude}
              longitude={profileData.patient_longitude}
              onLocationSelect={handleLocationSelect}
              height="250px"
            />
          </div>
        )}
        {isEditing && (
          <div className="flex gap-3">
            <button
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {showPhoneVerification && (
        <PhoneVerificationModal
          isOpen={showPhoneVerification}
          onClose={() => setShowPhoneVerification(false)}
          phoneNumber={profileData.patient_contact.replace(/\D/g, '')}
          onVerified={handlePhoneVerified}
        />
      )}
    </div>
  );
}

function SettingsTab({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const response = await fetch("/api/patient/notification-settings");
      if (response.ok) {
        const data = await response.json();
        setNotificationsEnabled(data.push_notifications ?? true);
        setEmailAlertsEnabled(data.email_alerts ?? true);
        setSmsAlertsEnabled(data.sms_alerts ?? false);
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const saveNotificationSetting = async (settingName: string, value: boolean) => {
    try {
      await fetch("/api/patient/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [settingName]: value })
      });
    } catch (error) {
      console.error("Error saving notification setting:", error);
    }
  };

  const handleNotificationsToggle = (value: boolean) => {
    setNotificationsEnabled(value);
    saveNotificationSetting("push_notifications", value);
  };

  const handleEmailToggle = (value: boolean) => {
    setEmailAlertsEnabled(value);
    saveNotificationSetting("email_alerts", value);
  };

  const handleSmsToggle = (value: boolean) => {
    setSmsAlertsEnabled(value);
    saveNotificationSetting("sms_alerts", value);
  };

  const handleLogout = () => {
    onLogout();
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      alert("Please type DELETE to confirm account deletion");
      return;
    }

    if (!confirm("Are you absolutely sure? This action cannot be undone and all your data will be permanently deleted.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        window.location.href = "/";
      } else {
        alert("Failed to delete account. Please try again or contact support.");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account. Please try again or contact support.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (showTransactionHistory) {
    return <TransactionHistoryView onBack={() => setShowTransactionHistory(false)} />;
  }

  if (showHelpCenter) {
    return <HelpCenterView onBack={() => setShowHelpCenter(false)} />;
  }

  if (showTerms) {
    return <TermsConditionsView onBack={() => setShowTerms(false)} />;
  }

  if (showPrivacy) {
    return <PrivacyPolicyView onBack={() => setShowPrivacy(false)} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
      
      {/* Profile Information */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-4 mb-4 border-b border-gray-200 pb-4">
          <User className="w-6 h-6 text-teal-600" />
          <h3 className="text-lg font-bold text-gray-900">Profile Information</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-xs text-gray-500">(from your login account)</span>
            </label>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg text-gray-900 border border-gray-200">
              <Mail className="w-5 h-5 text-gray-500" />
              <span className="truncate">{(user as any)?.profile?.email || (user as any)?.profile?.patient_email || (user as any)?.google_user_data?.email || (user as any)?.email || 'Not set'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">This email cannot be changed as it's linked to your login account</p>
          </div>
        </div>
      </div>
      
      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-4 mb-4 border-b border-gray-200 pb-4">
          <Settings className="w-6 h-6 text-teal-600" />
          <h3 className="text-lg font-bold text-gray-900">Notification Settings</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div>
              <h4 className="font-semibold text-gray-900">Push Notifications</h4>
              <p className="text-sm text-gray-600">Get notified about booking updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => handleNotificationsToggle(e.target.checked)}
                disabled={isLoadingSettings}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div>
              <h4 className="font-semibold text-gray-900">Email Alerts</h4>
              <p className="text-sm text-gray-600">Receive email updates for bookings</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlertsEnabled}
                onChange={(e) => handleEmailToggle(e.target.checked)}
                disabled={isLoadingSettings}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div>
              <h4 className="font-semibold text-gray-900">SMS Alerts</h4>
              <p className="text-sm text-gray-600">Get SMS for important updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={smsAlertsEnabled}
                onChange={(e) => handleSmsToggle(e.target.checked)}
                disabled={isLoadingSettings}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 peer-disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <button 
          onClick={() => setShowTransactionHistory(true)}
          className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <DollarSign className="w-6 h-6 text-teal-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
              <p className="text-sm text-gray-600">View your payment history</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </button>
      </div>

      {/* Help & Support */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <button 
          onClick={() => setShowHelpCenter(true)}
          className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <HelpCircle className="w-6 h-6 text-teal-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Help Center</h3>
              <p className="text-sm text-gray-600">Get help and support</p>
            </div>
          </div>
          <span className="text-gray-400">→</span>
        </button>
      </div>

      {/* Legal */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <button 
          onClick={() => setShowTerms(true)}
          className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-200"
        >
          <div className="flex items-center gap-4">
            <FileText className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-semibold text-gray-900">Terms & Conditions</h3>
          </div>
          <span className="text-gray-400">→</span>
        </button>
        <button 
          onClick={() => setShowPrivacy(true)}
          className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Shield className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-semibold text-gray-900">Privacy Policy</h3>
          </div>
          <span className="text-gray-400">→</span>
        </button>
      </div>

      {/* Logout */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      {/* Delete Account */}
      <div className="bg-red-50 rounded-2xl shadow-lg p-6 border-2 border-red-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-900">Delete Account</h3>
            <p className="text-sm text-red-700">Permanently delete your account and all data</p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
        >
          <XCircle className="w-5 h-5" />
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-900">Delete Account</h3>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              {isDeleting ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-4">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
                    <div className="text-center">
                      <p className="text-base font-semibold text-red-900 mb-1">Deleting Your Account</p>
                      <p className="text-sm text-red-700">This may take a few moments. Please wait...</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900 mb-2">Warning: This action is permanent!</p>
                      <ul className="text-sm text-red-800 space-y-1">
                        <li>• All your bookings will be deleted</li>
                        <li>• Your profile information will be removed</li>
                        <li>• This action cannot be undone</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {!isDeleting && (
                <>
                  <p className="text-sm text-gray-700 mb-4">
                    To confirm deletion, please type <span className="font-bold text-red-600">DELETE</span> in the box below:
                  </p>

                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  "Delete Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
