import { useState, useEffect } from "react";
import { X, MapPin, Stethoscope, AlertCircle, Phone, Mail, Calendar, Ambulance, Shield } from "lucide-react";
import KYCVerificationModal from "@/react-app/components/KYCVerificationModal";

interface Order {
  id: number;
  patient_name: string;
  patient_contact: string;
  patient_email: string;
  service_type: string;
  service_category: string;
  equipment_name: string;
  issue_description: string;
  urgency_level: string;
  patient_address: string;
  patient_city: string;
  patient_state: string;
  patient_pincode: string;
  preferred_date: string;
  preferred_time: string;
  patient_condition: string;
  pickup_address: string;
  dropoff_address: string;
  created_at: string;
}

interface PartnerOrderNotificationProps {
  order: Order;
  onAccept: (orderId: number) => void;
  onReject: (orderId: number) => void;
  onClose: () => void;
}

interface KYCStatus {
  kyc_verified: boolean;
  kyc_submission?: {
    status: string;
    rejection_reason?: string;
    submitted_at?: string;
  } | null;
}

export default function PartnerOrderNotification({ order, onAccept, onReject, onClose }: PartnerOrderNotificationProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [timeAgo, setTimeAgo] = useState("");
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [isLoadingKYC, setIsLoadingKYC] = useState(true);

  useEffect(() => {
    // Fetch KYC status
    const fetchKYCStatus = async () => {
      try {
        const response = await fetch("/api/kyc/status");
        if (response.ok) {
          const data = await response.json();
          setKycStatus(data);
        }
      } catch (error) {
        console.error("Error fetching KYC status:", error);
      } finally {
        setIsLoadingKYC(false);
      }
    };

    fetchKYCStatus();

    // Play notification sound and vibrate
    try {
      // Create notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioContext.destination);

      osc1.frequency.value = 800;
      osc2.frequency.value = 1000;
      osc1.type = 'sine';
      osc2.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime + 0.2);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime + 0.5);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.65);
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime + 0.7);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.85);

      osc1.start(audioContext.currentTime);
      osc2.start(audioContext.currentTime);
      osc1.stop(audioContext.currentTime + 0.85);
      osc2.stop(audioContext.currentTime + 0.85);
      
      // Trigger vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 200, 200, 100, 200]);
      }
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
    
    // Calculate time ago
    const updateTimeAgo = () => {
      const now = new Date().getTime();
      const orderTime = new Date(order.created_at).getTime();
      const diff = Math.floor((now - orderTime) / 1000); // seconds
      
      if (diff < 60) {
        setTimeAgo("Just now");
      } else if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        setTimeAgo(`${mins} minute${mins > 1 ? 's' : ''} ago`);
      } else {
        const hours = Math.floor(diff / 3600);
        setTimeAgo(`${hours} hour${hours > 1 ? 's' : ''} ago`);
      }
    };
    
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [order]);

  const handleAccept = async () => {
    setIsAccepting(true);
    await onAccept(order.id);
  };

  const handleReject = async () => {
    setIsRejecting(true);
    await onReject(order.id);
  };

  const isAmbulance = order.service_category?.toLowerCase().includes("ambulance");
  const isUrgent = order.urgency_level === "urgent" || order.urgency_level === "emergency";
  const isKYCVerified = kycStatus?.kyc_verified || false;
  const kycSubmission = kycStatus?.kyc_submission || null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
        {/* Header */}
        <div className={`bg-gradient-to-r ${
          isUrgent 
            ? "from-red-600 to-orange-600" 
            : "from-blue-600 to-indigo-600"
        } p-6 text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 ${
              isUrgent ? "bg-red-500" : "bg-blue-500"
            } rounded-full flex items-center justify-center animate-pulse`}>
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">New Booking Request!</h2>
              <p className="text-white text-opacity-90 text-sm">{timeAgo}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              isUrgent 
                ? "bg-red-500" 
                : "bg-blue-500"
            }`}>
              {order.service_category}
            </span>
            {isUrgent && (
              <span className="px-3 py-1 bg-red-500 rounded-full text-sm font-semibold animate-pulse">
                {order.urgency_level?.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Service Details */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Stethoscope className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-bold text-gray-900">{order.service_type}</h3>
                <p className="text-sm text-gray-600">{order.service_category}</p>
              </div>
            </div>
            
            {order.equipment_name && (
              <div className="mt-2 p-2 bg-white rounded-lg">
                <p className="text-sm text-gray-600">Equipment: <span className="font-semibold text-gray-900">{order.equipment_name}</span></p>
              </div>
            )}
          </div>

          {/* Patient Info */}
          <div className="border-2 border-gray-200 rounded-xl p-4">
            <h3 className="font-bold text-gray-900 mb-3">Patient Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                <span className="font-semibold">{order.patient_name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <a href={`tel:${order.patient_contact}`} className="font-medium hover:text-blue-600">
                  {order.patient_contact}
                </a>
              </div>
              {order.patient_email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <a href={`mailto:${order.patient_email}`} className="text-sm hover:text-blue-600">
                    {order.patient_email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Location Info */}
          {isAmbulance ? (
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Ambulance className="w-5 h-5 text-red-600" />
                Ambulance Details
              </h3>
              
              {order.patient_condition && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Patient Condition:</p>
                  <p className="font-semibold text-red-900">{order.patient_condition}</p>
                </div>
              )}
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">PICKUP LOCATION</p>
                  <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-900">{order.pickup_address}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">DROP-OFF LOCATION</p>
                  <div className="flex items-start gap-2 p-2 bg-purple-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-900">{order.dropoff_address}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Location
              </h3>
              <p className="text-gray-700">{order.patient_address}</p>
              <p className="text-sm text-gray-600 mt-1">
                {order.patient_city}, {order.patient_state} - {order.patient_pincode}
              </p>
            </div>
          )}

          {/* Schedule */}
          {(order.preferred_date || order.preferred_time) && (
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                Preferred Schedule
              </h3>
              <div className="flex gap-4">
                {order.preferred_date && (
                  <div className="flex-1 p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(order.preferred_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {order.preferred_time && (
                  <div className="flex-1 p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Time</p>
                    <p className="font-semibold text-gray-900">{order.preferred_time}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Requirement Details */}
          <div className="border-2 border-gray-200 rounded-xl p-4">
            <h3 className="font-bold text-gray-900 mb-2">
              {isAmbulance ? "Additional Notes" : "Service Requirement"}
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{order.issue_description}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          {isLoadingKYC ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !isKYCVerified ? (
            <div>
              <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-yellow-900 mb-1">KYC Verification Required</h4>
                    <p className="text-sm text-yellow-800">
                      You must complete KYC verification before you can accept or decline service requests. This is a one-time process to verify your identity and credentials.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowKYCModal(true)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Complete KYC Verification
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={isRejecting || isAccepting}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                {isRejecting ? "Rejecting..." : "Not Available"}
              </button>
              <button
                onClick={handleAccept}
                disabled={isAccepting || isRejecting}
                className={`flex-1 px-6 py-3 bg-gradient-to-r ${
                  isUrgent 
                    ? "from-red-600 to-orange-600" 
                    : "from-blue-600 to-indigo-600"
                } text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {isAccepting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Accepting...
                  </>
                ) : (
                  "Accept Booking"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KYC Verification Modal */}
      {showKYCModal && (
        <KYCVerificationModal
          onClose={() => setShowKYCModal(false)}
          kycStatus={kycSubmission}
          onSubmitSuccess={async () => {
            setShowKYCModal(false);
            // Refresh KYC status
            try {
              const response = await fetch("/api/kyc/status");
              if (response.ok) {
                const data = await response.json();
                setKycStatus(data);
              }
            } catch (error) {
              console.error("Error refreshing KYC status:", error);
            }
          }}
        />
      )}
    </div>
  );
}
