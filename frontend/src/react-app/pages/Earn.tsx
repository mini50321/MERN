import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import KYCVerificationModal from "@/react-app/components/KYCVerificationModal";
import PartnerOrderNotification from "@/react-app/components/PartnerOrderNotification";
import { useNursingPrices } from "@/react-app/hooks/useNursingPrices";
import { usePhysiotherapyPrices } from "@/react-app/hooks/usePhysiotherapyPrices";
import { useAmbulancePrices } from "@/react-app/hooks/useAmbulancePrices";
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Phone,
  AlertCircle,
  Loader2,
  Calendar,
  Wrench,
  Navigation,
  Star,
  Activity,
  MessageCircle,
  RotateCcw,
  Shield
} from "lucide-react";
import { useToast } from "@/react-app/components/ToastContainer";

interface ServiceOrder {
  id: number;
  patient_name: string;
  patient_contact: string;
  patient_email: string;
  patient_location: string;
  patient_address: string;
  patient_city: string;
  patient_state: string;
  patient_pincode: string;
  patient_latitude: number;
  patient_longitude: number;
  service_type: string;
  service_category: string;
  equipment_name: string;
  equipment_model: string;
  issue_description: string;
  urgency_level: string;
  status: string;
  quoted_price: number;
  quoted_currency: string;
  engineer_notes: string;
  responded_at: string;
  created_at: string;
  preferred_date: string;
  preferred_time: string;
  partner_rating: number;
  partner_review: string;
  user_rating: number;
  user_review: string;
  patient_condition: string;
  pickup_address: string;
  dropoff_address: string;
}

export default function Earn() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { getPriceForService: getNursingPrice } = useNursingPrices();
  const { getPriceForService: getPhysiotherapyPrice } = usePhysiotherapyPrices();
  const { prices: ambulancePrices } = useAmbulancePrices();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    quoted_price: "",
    engineer_notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "active" | "completed">("new");
  const [kycData, setKycData] = useState<any>(null);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [isCheckingKYC, setIsCheckingKYC] = useState(true);
  const [showUserRatingModal, setShowUserRatingModal] = useState(false);
  const [userRatingOrderId, setUserRatingOrderId] = useState<number | null>(null);
  const [userRating, setUserRating] = useState(5);
  const [userReview, setUserReview] = useState("");
  const [notificationOrder, setNotificationOrder] = useState<ServiceOrder | null>(null);
  const previousPendingOrderIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      checkKYCStatus();
      fetchOrders(); 
      
      const interval = setInterval(() => {
        fetchOrders(true); 
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const checkKYCStatus = async () => {
    setIsCheckingKYC(true);
    try {
      const response = await fetch("/api/kyc/status");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("KYC Status Response:", data);
      setKycData(data);
      
      if (!data.is_verified && (data.status === "not_submitted" || data.status === "rejected" || !data.status)) {
        setShowKYCModal(true);
      }
    } catch (error) {
      console.error("Error checking KYC status:", error);
      setKycData({ is_verified: false, status: "not_submitted" });
    } finally {
      setIsCheckingKYC(false);
    }
  };

  const fetchOrders = async (silent = false) => {
    try {
      const response = await fetch("/api/service-orders");
      const data = await response.json();
      
      const pendingOrders = data.filter((o: ServiceOrder) => o.status === "pending");
      const currentPendingIds = new Set<number>(pendingOrders.map((o: ServiceOrder) => o.id));
      
      const newOrders = pendingOrders.filter((o: ServiceOrder) => 
        !previousPendingOrderIds.current.has(o.id)
      );
      
      previousPendingOrderIds.current = currentPendingIds;
      
      if (newOrders.length > 0 && !isInitialLoad) {
        const newestOrder = newOrders.sort((a: ServiceOrder, b: ServiceOrder) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        setNotificationOrder(newestOrder);
      }
      
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      if (!silent) {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    }
  };

  const isNonBiomedicalService = (order: ServiceOrder) => {
    const category = (order.service_category || "").toLowerCase();
    return category.includes("nursing") || 
           category.includes("physio") || 
           category.includes("ambulance");
  };

  const handleAccept = (order: ServiceOrder) => {
    if (isNonBiomedicalService(order)) {
      let priceToUse = order.quoted_price;
      
      if (!priceToUse) {
        const category = (order.service_category || "").toLowerCase();
        const isNursing = category.includes("nursing");
        const isPhysio = category.includes("physio");
        const isAmbulance = category.includes("ambulance");
        
        if (isNursing || isPhysio) {
          const serviceNameVariations = [
            order.service_type,
            order.service_type?.toLowerCase(),
            order.service_type?.toUpperCase(),
            ...(order.service_type?.split(' ') || []).map((word: string) => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
          ];
          
          let priceData = null;
          for (const name of serviceNameVariations) {
            if (!name) continue;
            priceData = isNursing 
              ? getNursingPrice(name)
              : getPhysiotherapyPrice(name);
            if (priceData) break;
          }
          
          if (priceData) {
            priceToUse = isNursing 
              ? (priceData as any).per_visit_price 
              : (priceData as any).per_session_price;
          }
        } else if (isAmbulance && order.service_type) {
          const ambulancePrice = ambulancePrices.find(
            p => p.service_name.toLowerCase() === order.service_type.toLowerCase() ||
                 order.service_type.toLowerCase().includes(p.service_name.toLowerCase()) ||
                 p.service_name.toLowerCase().includes(order.service_type.toLowerCase())
          );
          
          if (ambulancePrice) {
            priceToUse = ambulancePrice.minimum_fare;
          }
        }
      }
      
      if (!priceToUse) {
        showError("Price not available for this service. Please contact support.");
        return;
      }
      
      const orderWithPrice = { ...order, quoted_price: priceToUse };
      handleDirectAccept(orderWithPrice);
    } else {
      setSelectedOrder(order);
      setQuoteForm({
        quoted_price: "",
        engineer_notes: ""
      });
      setShowQuoteModal(true);
    }
  };

  const handleDirectAccept = async (order: ServiceOrder) => {
    if (!confirm(`Accept this ${order.service_category || "service"} request for ₹${order.quoted_price?.toLocaleString()}?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/service-orders/${order.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          service_type: order.service_type || order.service_category || "Service"
        })
      });
      
      if (response.ok) {
        showSuccess("Request accepted! You can now contact the patient to coordinate the service.");
        fetchOrders();
      } else {
        const data = await response.json();
        if (data.requires_kyc) {
          showError(data.message || "Please complete KYC verification before accepting orders.");
        } else {
          showError(data.error || "Failed to accept request");
        }
      }
    } catch (error) {
      showError("Failed to accept request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async (orderId: number) => {
    if (!confirm("Are you sure you want to decline this service order?")) {
      return;
    }

    try {
      const response = await fetch(`/api/service-orders/${orderId}/decline`, {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        showSuccess("Order declined successfully");
        fetchOrders();
      } else {
        const data = await response.json();
        if (data.requires_kyc) {
          showError(data.message || "Please complete KYC verification before declining orders.");
        } else {
          showError(data.error || "Failed to decline order");
        }
      }
    } catch (error) {
      showError("Failed to decline order");
    }
  };

  const handleMarkCompleted = async (orderId: number) => {
    if (!confirm("Mark this service as completed? The patient will be able to rate your service.")) {
      return;
    }

    try {
      const response = await fetch(`/api/service-orders/${orderId}/complete`, {
        method: "POST"
      });
      
      if (response.ok) {
        showSuccess("Service marked as completed!");
        fetchOrders();
      } else {
        showError("Failed to mark as completed");
      }
    } catch (error) {
      showError("Failed to mark as completed");
    }
  };

  const handleRateUser = async () => {
    if (!userRatingOrderId) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/service-orders/${userRatingOrderId}/rate-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: userRating,
          review: userReview
        })
      });
      
      if (response.ok) {
        showSuccess("Rating submitted successfully!");
        setShowUserRatingModal(false);
        setUserRatingOrderId(null);
        setUserRating(5);
        setUserReview("");
        fetchOrders();
      } else {
        const data = await response.json();
        showError(data.error || "Failed to submit rating");
      }
    } catch (error) {
      showError("Failed to submit rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openUserRatingModal = (orderId: number) => {
    setUserRatingOrderId(orderId);
    setUserRating(5);
    setUserReview("");
    setShowUserRatingModal(true);
  };

  const handleReleaseOrder = async (orderId: number) => {
    if (!confirm("Release this order? It will become available for other partners to accept.")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/service-orders/${orderId}/release`, {
        method: "POST"
      });
      
      if (response.ok) {
        showSuccess("Order released successfully. It's now available for other partners.");
        fetchOrders();
      } else {
        const data = await response.json();
        showError(data.error || "Failed to release order");
      }
    } catch (error) {
      showError("Failed to release order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsApp = (phone: string, patientName: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const message = encodeURIComponent(`Hello ${patientName}, I'm your service partner from MAVY. I've accepted your service request and I'm reaching out to coordinate.`);
    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank');
  };

  const openPhoneDialer = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrder || !quoteForm.quoted_price) {
      showError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/service-orders/${selectedOrder.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          service_type: selectedOrder.service_type || selectedOrder.service_category || "Service",
          quoted_price: parseFloat(quoteForm.quoted_price),
          engineer_notes: quoteForm.engineer_notes
        })
      });
      
      if (response.ok) {
        showSuccess("Quote submitted successfully!");
        setShowQuoteModal(false);
        setSelectedOrder(null);
        setQuoteForm({ quoted_price: "", engineer_notes: "" });
        fetchOrders();
      } else {
        const data = await response.json();
        if (data.requires_kyc) {
          showError(data.message || "Please complete KYC verification before submitting quotes.");
          setShowQuoteModal(false);
        } else {
          showError(data.error || "Failed to submit quote");
        }
      }
    } catch (error) {
      showError("Failed to submit quote");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      default: return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium">Pending Review</span>;
      case "quote_sent":
        return <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          Awaiting Customer Confirmation
        </span>;
      case "accepted":
        return <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" />
          Accepted - Provide Service
        </span>;
      case "declined":
        return <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" />
          Quote Declined
        </span>;
      case "cancelled":
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" />
          Cancelled by Patient
        </span>;
      case "completed":
        return <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" />
          Completed
        </span>;
      default:
        return <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm font-medium">{status}</span>;
    }
  };

  const newOrders = orders.filter(o => o.status === "pending");
  const activeOrders = orders.filter(o => o.status === "quote_sent" || o.status === "accepted");
  const completedOrders = orders.filter(o => o.status === "completed" || o.status === "declined" || o.status === "cancelled");
  
  // Get orders to display based on active tab
  const displayOrders = activeTab === "new" ? newOrders :
                       activeTab === "active" ? activeOrders :
                       completedOrders;

  if (!user) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto mb-20 lg:mb-0 p-6">
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in required</h3>
            <p className="text-gray-600">Please sign in to view service orders</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show KYC verification requirement
  if (isCheckingKYC) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto mb-20 lg:mb-0 p-6">
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Checking verification status...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (kycData && !kycData.is_verified && kycData.status === "pending") {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto mb-20 lg:mb-0 p-6">
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">KYC Verification Pending</h3>
            <p className="text-gray-600 mb-4">
              Your KYC documents are under review by our team. You'll be able to accept service orders once your verification is approved.
            </p>
            <p className="text-sm text-gray-500">This typically takes 24-48 hours</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isUserVerified = kycData?.is_verified === true;
  const kycStatus = kycData?.status;
  const shouldShowKYCRequired = !isUserVerified || kycStatus === "not_submitted" || kycStatus === "rejected" || !kycStatus;

  if (shouldShowKYCRequired) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto mb-20 lg:mb-0 p-6">
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">KYC Verification Required</h3>
            <p className="text-gray-600 mb-4">
              You must complete KYC verification before you can accept or decline service orders. This is a one-time process to verify your identity and credentials.
            </p>
            <button
              onClick={() => setShowKYCModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto"
            >
              <Shield className="w-5 h-5" />
              Complete KYC Verification
            </button>
          </div>
        </div>
        {showKYCModal && (
          <KYCVerificationModal
            onClose={() => setShowKYCModal(false)}
            kycStatus={kycData || { is_verified: false, status: "not_submitted" }}
            onSubmitSuccess={() => {
              setShowKYCModal(false);
              checkKYCStatus();
            }}
          />
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto mb-20 lg:mb-0 p-3 sm:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Earn</h1>
              <p className="text-gray-600 text-xs sm:text-base">Manage service orders from patients</p>
            </div>
            {/* KYC Verification Button */}
            {kycData && !kycData.is_verified && (kycData.status === "not_submitted" || kycData.status === "rejected" || !kycData.status) && (
              <button
                onClick={() => setShowKYCModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 text-sm sm:text-base"
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Complete KYC Verification</span>
                <span className="sm:hidden">KYC</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-md mb-4 sm:mb-8 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("new")}
              className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 font-semibold transition-all border-b-2 text-xs sm:text-base ${
                activeTab === "new"
                  ? "text-yellow-600 border-yellow-600 bg-yellow-50"
                  : "text-gray-600 border-transparent hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">New Proposals</span>
                <span className="sm:hidden">New</span>
                {newOrders.length > 0 && (
                  <span className="px-1.5 sm:px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full font-bold">
                    {newOrders.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 font-semibold transition-all border-b-2 text-xs sm:text-base ${
                activeTab === "active"
                  ? "text-green-600 border-green-600 bg-green-50"
                  : "text-gray-600 border-transparent hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Active</span>
                {activeOrders.length > 0 && (
                  <span className="px-1.5 sm:px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-bold">
                    {activeOrders.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 font-semibold transition-all border-b-2 text-xs sm:text-base ${
                activeTab === "completed"
                  ? "text-blue-600 border-blue-600 bg-blue-50"
                  : "text-gray-600 border-transparent hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Completed</span>
                <span className="sm:hidden">Done</span>
                {completedOrders.length > 0 && (
                  <span className="px-1.5 sm:px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-bold">
                    {completedOrders.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {activeTab === "new" ? "No new proposals" :
               activeTab === "active" ? "No active orders" :
               "No completed orders"}
            </h3>
            <p className="text-gray-600">
              {activeTab === "new" ? "New service requests will appear here" :
               activeTab === "active" ? "Accepted service orders will appear here" :
               "Your completed services will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-3">
                  {/* Compact Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{order.service_category || "Service"}</h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        {order.service_type && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                            <Wrench className="w-3 h-3" />
                            {order.service_type}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs ${getUrgencyColor(order.urgency_level)}`}>
                          <AlertCircle className="w-3 h-3" />
                          {order.urgency_level}
                        </span>
                        <span className="text-gray-500 flex items-center gap-0.5 text-xs">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Compact Info */}
                  <div className="space-y-1 mb-2">
                    {order.equipment_name && (
                      <div className="flex items-start gap-1.5 text-xs">
                        <Wrench className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-900 font-medium">
                          {order.equipment_name}
                          {order.equipment_model && <span className="text-gray-600 font-normal"> ({order.equipment_model})</span>}
                        </p>
                      </div>
                    )}
                    <div className="flex items-start gap-1.5 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700 line-clamp-2">{order.issue_description}</p>
                    </div>
                  </div>

                  {/* Compact Schedule */}
                  {(order.preferred_date || order.preferred_time) && (
                    <div className="flex items-center gap-1.5 text-xs bg-indigo-50 px-2 py-1 rounded mb-2">
                      <Calendar className="w-3 h-3 text-indigo-600" />
                      <span className="text-indigo-900 font-medium text-xs">
                        {order.preferred_date && new Date(order.preferred_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {order.preferred_time && ` at ${order.preferred_time}`}
                      </span>
                    </div>
                  )}

                  {/* Compact Patient Details for Non-Biomedical Services */}
                  {order.status === "pending" && isNonBiomedicalService(order) && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-semibold text-blue-900 mb-2">Patient Info</p>
                      <div className="space-y-1 text-xs">
                        <p className="text-gray-900 font-medium">{order.patient_name || "Not provided"}</p>
                        <p className="text-gray-600">
                          {[order.patient_city, order.patient_state, order.patient_pincode].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      
                      {/* Compact Price Display */}
                      {order.quoted_price && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-green-600">₹{order.quoted_price.toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-900">
                        <Phone className="w-3 h-3 inline mr-1" />
                        Contact shared after acceptance
                      </div>
                    </div>
                  )}

                  {/* Compact Privacy Notice */}
                  {order.status !== "accepted" && order.status !== "completed" && !isNonBiomedicalService(order) && (
                    <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-900 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Contact shared after quote accepted
                      </p>
                    </div>
                  )}

                  {/* Ongoing Service Animation for Accepted Orders */}
                  {order.status === "accepted" && (
                    <div className="mb-3">
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
                              ⚡ Service in Progress
                            </h4>
                            <p className="text-sm text-white/90 font-medium">
                              Contact patient and provide service
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
                  )}

                  {/* Compact Contact Details */}
                  {(order.status === "accepted" || (order.status === "quote_sent" && isNonBiomedicalService(order))) && (
                    <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          <p className="text-xs font-semibold text-green-900">Patient Info</p>
                        </div>
                        {/* Icon Buttons */}
                        <div className="flex gap-1.5">
                          {order.patient_contact && (
                            <>
                              <button
                                onClick={() => openPhoneDialer(order.patient_contact)}
                                className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-all shadow-sm hover:shadow-md hover:scale-110"
                                title="Call Patient"
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openWhatsApp(order.patient_contact, order.patient_name)}
                                className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-all shadow-sm hover:shadow-md hover:scale-110"
                                title="WhatsApp Patient"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {order.patient_latitude && order.patient_longitude && (
                            <button
                              onClick={() => openGoogleMaps(order.patient_latitude, order.patient_longitude)}
                              className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-all shadow-sm hover:shadow-md hover:scale-110"
                              title="Get Directions"
                            >
                              <Navigation className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <p className="text-gray-900 font-semibold">{order.patient_name}</p>
                        <p className="text-gray-600 truncate">📞 {order.patient_contact}</p>
                        {(order.patient_address || order.patient_city) && (
                          <p className="text-gray-600 line-clamp-1">
                            📍 {[order.patient_city, order.patient_pincode].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Compact Quote Display */}
                  {(order.status === "quote_sent" || order.status === "accepted") && order.quoted_price && (
                    <div className={`rounded-lg p-2.5 mb-3 border ${
                      order.status === "quote_sent" 
                        ? "bg-purple-50 border-purple-200" 
                        : "bg-green-50 border-green-200"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600">Your Quote</p>
                          <p className="text-lg font-bold text-gray-900">₹{order.quoted_price.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compact Cancelled/Declined Notice */}
                  {(order.status === "cancelled" || order.status === "declined") && (
                    <div className="bg-gray-50 rounded-lg p-2.5 mb-3 border border-gray-200">
                      <p className="text-xs text-gray-700 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        {order.status === "cancelled" ? "Cancelled by patient" : "Quote declined"}
                      </p>
                      {order.quoted_price && (
                        <p className="text-xs text-gray-600 mt-1">Quote: ₹{order.quoted_price.toLocaleString()}</p>
                      )}
                    </div>
                  )}

                  {/* Compact Completed Status */}
                  {order.status === "completed" && (
                    <div className="bg-blue-50 rounded-lg p-2.5 mb-3 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <p className="text-xs font-semibold text-blue-900">Completed</p>
                        </div>
                        <p className="text-sm font-bold text-blue-700">₹{order.quoted_price?.toLocaleString() || 0}</p>
                      </div>
                      
                      {order.partner_rating && (
                        <div className="bg-white rounded p-2 mb-2">
                          <div className="flex items-center gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= order.partner_rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                            <span className="text-xs font-semibold text-gray-700 ml-1">
                              ({order.partner_rating}/5)
                            </span>
                          </div>
                          {order.partner_review && (
                            <p className="text-xs text-gray-700 italic line-clamp-2">"{order.partner_review}"</p>
                          )}
                        </div>
                      )}
                      
                      {!order.user_rating && (
                        <button
                          onClick={() => openUserRatingModal(order.id)}
                          className="w-full px-3 py-1.5 bg-amber-500 text-white rounded text-xs font-medium hover:bg-amber-600 transition-all flex items-center justify-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5" />
                          Rate Patient
                        </button>
                      )}
                    </div>
                  )}

                  {/* Compact Action Buttons */}
                  {order.status === "pending" && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAccept(order)}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        {isNonBiomedicalService(order) ? "Accept" : "Quote"}
                      </button>
                      <button
                        onClick={() => handleDecline(order.id)}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Decline
                      </button>
                    </div>
                  )}

                  {order.status === "accepted" && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleMarkCompleted(order.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Complete
                      </button>
                      <button
                        onClick={() => handleReleaseOrder(order.id)}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}

                  {order.status === "quote_sent" && (
                    <button
                      onClick={() => handleReleaseOrder(order.id)}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      Release Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quote Modal */}
        {showQuoteModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Submit Your Quote</h2>
                <p className="text-gray-600 mt-1">Service request from {selectedOrder.patient_name}</p>
              </div>

              <form onSubmit={handleSubmitQuote} className="p-6 space-y-6">
                {/* Quoted Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quoted Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quoteForm.quoted_price}
                    onChange={(e) => setQuoteForm({ ...quoteForm, quoted_price: e.target.value })}
                    placeholder="Enter your price quote"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Patient will see this quote and can accept or decline
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={quoteForm.engineer_notes}
                    onChange={(e) => setQuoteForm({ ...quoteForm, engineer_notes: e.target.value })}
                    placeholder="Any additional information about the service, timeline, or requirements..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> Patient contact and location details will be shared with you only after they accept your quote.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuoteModal(false);
                      setSelectedOrder(null);
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Submit Quote
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Rating Modal */}
        {showUserRatingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Rate Patient</h2>
                <p className="text-gray-600 mt-1">Share your experience working with this patient</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Your Rating
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setUserRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-10 h-10 ${
                            star <= userRating 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-gray-300 hover:text-yellow-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-2">
                    {userRating === 1 && "Poor"}
                    {userRating === 2 && "Fair"}
                    {userRating === 3 && "Good"}
                    {userRating === 4 && "Very Good"}
                    {userRating === 5 && "Excellent"}
                  </p>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review (Optional)
                  </label>
                  <textarea
                    value={userReview}
                    onChange={(e) => setUserReview(e.target.value)}
                    placeholder="Share details about your experience..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserRatingModal(false);
                      setUserRatingOrderId(null);
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRateUser}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Star className="w-5 h-5" />
                        Submit Rating
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* KYC Verification Modal */}
      {showKYCModal && (
        <KYCVerificationModal
          onClose={() => setShowKYCModal(false)}
          kycStatus={kycData}
          onSubmitSuccess={() => {
            setShowKYCModal(false);
            checkKYCStatus();
          }}
        />
      )}

      {/* Partner Order Notification - Shows with sound when new order arrives */}
      {notificationOrder && (
        <PartnerOrderNotification
          order={notificationOrder}
          onAccept={async (orderId) => {
            setNotificationOrder(null);
            const order = orders.find(o => o.id === orderId);
            if (order) {
              await handleDirectAccept(order);
            }
          }}
          onReject={async (orderId) => {
            setNotificationOrder(null);
            await handleDecline(orderId);
          }}
          onClose={() => setNotificationOrder(null)}
        />
      )}
      </div>
    </DashboardLayout>
  );
}
