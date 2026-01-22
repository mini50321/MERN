import { useState } from "react";
import { ChevronLeft, MapPin, Loader2, Gift, Check, X } from "lucide-react";

interface OnboardingPatientDetailsProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

export default function OnboardingPatientDetails({ onComplete, onBack }: OnboardingPatientDetailsProps) {
  const [formData, setFormData] = useState({
    patient_full_name: "",
    patient_contact: "",
    patient_email: "",
    patient_address: "",
    patient_city: "",
    patient_pincode: "",
    patient_latitude: null as number | null,
    patient_longitude: null as number | null
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralStatus, setReferralStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [referralMessage, setReferralMessage] = useState("");

  const handleGetLocation = async () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 0,
          enableHighAccuracy: true
        });
      });

      setFormData({
        ...formData,
        patient_latitude: position.coords.latitude,
        patient_longitude: position.coords.longitude
      });

      // Optionally, you can use reverse geocoding to get address
      // For now, just inform the user
      alert(`Location captured: ${position.coords.latitude}, ${position.coords.longitude}`);
    } catch (error) {
      console.error("Location error:", error);
      alert("Unable to get your location. Please enter your address manually.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralStatus('idle');
      setReferralMessage('');
      return;
    }

    setReferralStatus('validating');
    try {
      // Check if code exists by looking up the referrer
      const response = await fetch(`/api/referrals/validate?code=${encodeURIComponent(code.trim())}`);
      const data = await response.json();
      
      if (data.valid) {
        setReferralStatus('valid');
        setReferralMessage(`Code valid! You'll get ₹${data.reward || 50} bonus after your first transaction.`);
      } else {
        setReferralStatus('invalid');
        setReferralMessage(data.error || 'Invalid referral code');
      }
    } catch {
      setReferralStatus('invalid');
      setReferralMessage('Unable to validate code. You can apply it later from Settings.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataWithReferral = {
      ...formData,
      referral_code: referralStatus === 'valid' ? referralCode.trim().toUpperCase() : undefined
    };
    onComplete(dataWithReferral);
  };

  const handleSkip = () => {
    // Skip profile completion but still save account type
    const dataWithReferral = {
      account_type: "patient",
      referral_code: referralStatus === 'valid' ? referralCode.trim().toUpperCase() : undefined
    };
    onComplete(dataWithReferral);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile Information</h1>
      <p className="text-gray-600 mb-4">
        This information will be used to auto-fill booking forms. You can complete it now or skip and fill it later when booking a service.
      </p>
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Optional:</strong> You can skip this step and complete your profile later from Settings or when booking a service.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.patient_full_name}
                onChange={(e) => setFormData({ ...formData, patient_full_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                value={formData.patient_contact}
                onChange={(e) => setFormData({ ...formData, patient_contact: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.patient_email}
                onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="your.email@example.com"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={formData.patient_address}
                onChange={(e) => setFormData({ ...formData, patient_address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Street address, building name, flat no."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.patient_city}
                  onChange={(e) => setFormData({ ...formData, patient_city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={formData.patient_pincode}
                  onChange={(e) => setFormData({ ...formData, patient_pincode: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="123456"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location (Optional)</h3>
          <p className="text-sm text-gray-600 mb-3">
            Share your location to help service providers find you easily
          </p>
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLoadingLocation}
            className="flex items-center gap-2 px-4 py-3 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingLocation ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                Get Current Location
              </>
            )}
          </button>
          {formData.patient_latitude && formData.patient_longitude && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              ✓ Location captured successfully
            </div>
          )}
        </div>

        {/* Referral Code */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            Have a Referral Code?
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Enter a friend's referral code to earn bonus credits on your first transaction
          </p>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={referralCode}
                onChange={(e) => {
                  setReferralCode(e.target.value.toUpperCase());
                  setReferralStatus('idle');
                  setReferralMessage('');
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 uppercase font-mono tracking-wider ${
                  referralStatus === 'valid' ? 'border-green-500 focus:ring-green-500 bg-green-50' :
                  referralStatus === 'invalid' ? 'border-red-500 focus:ring-red-500 bg-red-50' :
                  'border-gray-300 focus:ring-teal-500'
                }`}
                placeholder="Enter code (e.g., BIO12345)"
              />
              {referralStatus === 'valid' && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
              )}
              {referralStatus === 'invalid' && (
                <X className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600" />
              )}
            </div>
            <button
              type="button"
              onClick={() => validateReferralCode(referralCode)}
              disabled={!referralCode.trim() || referralStatus === 'validating'}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {referralStatus === 'validating' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Apply'
              )}
            </button>
          </div>
          {referralMessage && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              referralStatus === 'valid' ? 'bg-green-50 border border-green-200 text-green-800' :
              'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {referralStatus === 'valid' ? '🎉 ' : '⚠️ '}{referralMessage}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-300 transition-all"
          >
            Skip for Now
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-bold text-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            Save & Continue
          </button>
        </div>
      </form>
    </div>
  );
}
