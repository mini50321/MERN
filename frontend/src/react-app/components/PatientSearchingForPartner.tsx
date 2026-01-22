import { useEffect, useState } from "react";
import { MapPin, Clock, CheckCircle, Phone, MessageCircle, Star, AlertCircle, ChevronRight, X } from "lucide-react";

interface SearchingForPartnerProps {
  orderId: number;
  onClose: () => void;
}

export default function PatientSearchingForPartner({ orderId, onClose }: SearchingForPartnerProps) {
  const [searchStatus, setSearchStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dots, setDots] = useState("");

  // Animated dots for searching text
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Poll for search status every 3 seconds
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/patient/bookings/${orderId}/search-status`);
        if (response.ok) {
          const data = await response.json();
          setSearchStatus(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error checking search status:", error);
      }
    };

    // Check immediately on mount
    checkStatus();

    // Then poll every 3 seconds
    const interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  const isSearching = searchStatus?.status === "searching";
  const isFound = searchStatus?.status === "found";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header with Close Button */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-6 rounded-t-2xl flex items-center justify-between shadow-lg z-10">
          <div>
            <h1 className="text-2xl font-bold">Order #{orderId}</h1>
            <p className="text-sm text-teal-100 mt-1">{searchStatus?.booking?.service_category || "Loading..."}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Close and view in My Bookings"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">{isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium text-lg">Loading{dots}</p>
          </div>
        ) : (
          <>
        {isSearching && (
          <>
            {/* Animated Searching Icon */}
            <div className="relative mb-8">
              {/* Outer ripple rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 bg-teal-400 rounded-full opacity-20 animate-ping" style={{ animationDuration: '2s' }}></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-teal-400 rounded-full opacity-30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }}></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-teal-400 rounded-full opacity-40 animate-ping" style={{ animationDuration: '1s', animationDelay: '0.6s' }}></div>
              </div>

              {/* Center icon */}
              <div className="relative w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center shadow-2xl">
                <MapPin className="w-10 h-10 text-white animate-bounce" />
              </div>
            </div>

            {/* Status Text */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {searchStatus?.message || "Searching for partner nearby"}{dots}
              </h2>
              <p className="text-gray-600 text-lg mb-2">Please wait while we find the best partner for you</p>
              
              {/* Search Duration */}
              <div className="flex items-center justify-center gap-2 text-gray-500 mt-4">
                <Clock className="w-5 h-5" />
                <span className="text-sm">
                  Searching for {searchStatus?.search_duration_minutes || 0} min {searchStatus?.search_duration_seconds ? (searchStatus.search_duration_seconds % 60) : 0} sec
                </span>
              </div>

              {/* Available Partners Count */}
              {searchStatus?.available_partners_count !== undefined && searchStatus.available_partners_count > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold">{searchStatus.available_partners_count} partner(s) available in your area</span>
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="w-full max-w-md mb-8">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-center text-xs text-gray-500 mt-2">{searchStatus?.estimated_wait_time || "Partners typically respond within 5-10 minutes"}</p>
            </div>

            {/* Service Details Card */}
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-teal-600" />
                Your Request
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-semibold text-gray-900">{searchStatus?.booking?.service_type}</span>
                </div>
                {searchStatus?.booking?.quoted_price && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-bold text-teal-600">₹{searchStatus.booking.quoted_price}</span>
                  </div>
                )}
                {searchStatus?.booking?.urgency_level && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Urgency:</span>
                    <span className={`font-semibold ${
                      searchStatus.booking.urgency_level === 'emergency' ? 'text-red-600' : 
                      searchStatus.booking.urgency_level === 'urgent' ? 'text-orange-600' : 
                      'text-green-600'
                    }`}>
                      {searchStatus.booking.urgency_level.charAt(0).toUpperCase() + searchStatus.booking.urgency_level.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info Text */}
            <p className="text-center text-sm text-gray-500 italic">
              You can close this window and check status anytime in "My Bookings"
            </p>
          </>
        )}

        {isFound && searchStatus?.partner && (
          <>
            {/* Success Animation */}
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Partner Found! 🎉</h2>
              <p className="text-gray-600 text-lg">Your service partner has accepted your request</p>
            </div>

            {/* Partner Details Card */}
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border-2 border-green-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Your Partner</h3>
                {searchStatus.partner.average_rating && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-full">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm font-bold text-yellow-800">{searchStatus.partner.average_rating}/5</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900 text-lg">{searchStatus.partner.name}</p>
                </div>

                {searchStatus.partner.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <a href={`tel:${searchStatus.partner.phone}`} className="font-semibold text-teal-600 text-lg hover:underline">
                      {searchStatus.partner.phone}
                    </a>
                  </div>
                )}

                {searchStatus.partner.completed_orders > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>{searchStatus.partner.completed_orders} completed orders</span>
                    </div>
                    {searchStatus.partner.total_ratings > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{searchStatus.partner.total_ratings} customer reviews</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {searchStatus.partner.phone && (
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${searchStatus.partner.phone}`}
                    className="flex flex-col items-center gap-2 p-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all shadow-md hover:shadow-lg"
                  >
                    <Phone className="w-6 h-6" />
                    <span className="text-sm font-semibold">Call Partner</span>
                  </a>

                  <a
                    href={`https://wa.me/91${searchStatus.partner.phone.replace(/\D/g, '').slice(-10)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 bg-[#25D366] text-white rounded-xl hover:bg-[#1fb855] transition-all shadow-md hover:shadow-lg"
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span className="text-sm font-semibold">WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            {/* Service Amount */}
            {searchStatus?.booking?.quoted_price && (
              <div className="w-full max-w-md bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Service Amount</span>
                  <span className="text-3xl font-bold text-green-700">₹{searchStatus.booking.quoted_price}</span>
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full max-w-md px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2 text-lg"
            >
              Close & View in My Bookings
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
        </>
        )}
        </div>
      </div>
    </div>
  );
}
