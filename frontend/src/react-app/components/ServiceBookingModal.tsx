import { useState, useEffect } from "react";
import { X, MapPin, Calendar, FileText, Mail, Stethoscope, CheckCircle, ChevronRight, Ambulance, Navigation, IndianRupee, AlertCircle } from "lucide-react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import LocationMapPicker from "@/react-app/components/LocationMapPicker";
import AmbulanceLocationPicker from "@/react-app/components/AmbulanceLocationPicker";
import { useNursingPrices } from "@/react-app/hooks/useNursingPrices";
import { usePhysiotherapyPrices } from "@/react-app/hooks/usePhysiotherapyPrices";
import { useAmbulancePrices } from "@/react-app/hooks/useAmbulancePrices";
import { playBookingConfirmSound } from "@/react-app/utils/soundEffects";

interface ServiceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    title: string;
    gradient: string;
  };
  serviceType: {
    name: string;
    description: string;
  };
}

const allMedicalEquipment = [
  { category: "Home Care Products", name: "Oxygen Concentrator" },
  { category: "Home Care Products", name: "BiPAP Machine" },
  { category: "Home Care Products", name: "CPAP Machine" },
  { category: "Home Care Products", name: "Nebulizer" },
  { category: "Home Care Products", name: "Blood Pressure Monitor" },
  { category: "Home Care Products", name: "Pulse Oximeter" },
  { category: "Home Care Products", name: "Glucometer" },
  { category: "Home Care Products", name: "Thermometer" },
  { category: "Home Care Products", name: "Wheelchair" },
  { category: "Home Care Products", name: "Hospital Bed" },
  { category: "Home Care Products", name: "Patient Lift" },
  { category: "Home Care Products", name: "Suction Machine" },
  
  { category: "Diagnostic Imaging", name: "X-Ray Machine" },
  { category: "Diagnostic Imaging", name: "CT Scanner" },
  { category: "Diagnostic Imaging", name: "MRI Scanner" },
  { category: "Diagnostic Imaging", name: "Ultrasound Machine" },
  { category: "Diagnostic Imaging", name: "Mammography Unit" },
  { category: "Diagnostic Imaging", name: "Fluoroscopy System" },
  { category: "Diagnostic Imaging", name: "Dental X-Ray" },
  { category: "Diagnostic Imaging", name: "Portable X-Ray" },
  { category: "Diagnostic Imaging", name: "C-Arm Machine" },
  { category: "Diagnostic Imaging", name: "DEXA Scan Machine" },
  
  { category: "Patient Monitoring", name: "Patient Monitor" },
  { category: "Patient Monitoring", name: "ECG Machine" },
  { category: "Patient Monitoring", name: "Holter Monitor" },
  { category: "Patient Monitoring", name: "Temperature Monitor" },
  { category: "Patient Monitoring", name: "Cardiac Monitor" },
  { category: "Patient Monitoring", name: "Multi-Parameter Monitor" },
  { category: "Patient Monitoring", name: "Fetal Monitor" },
  { category: "Patient Monitoring", name: "Capnography Monitor" },
  
  { category: "Life Support & Critical Care", name: "Ventilator" },
  { category: "Life Support & Critical Care", name: "Anesthesia Machine" },
  { category: "Life Support & Critical Care", name: "ICU Ventilator" },
  { category: "Life Support & Critical Care", name: "Defibrillator" },
  { category: "Life Support & Critical Care", name: "AED (Automated External Defibrillator)" },
  { category: "Life Support & Critical Care", name: "Infusion Pump" },
  { category: "Life Support & Critical Care", name: "Syringe Pump" },
  { category: "Life Support & Critical Care", name: "ECMO Machine" },
  
  { category: "Laboratory Equipment", name: "Hematology Analyzer" },
  { category: "Laboratory Equipment", name: "Biochemistry Analyzer" },
  { category: "Laboratory Equipment", name: "Blood Gas Analyzer" },
  { category: "Laboratory Equipment", name: "Electrolyte Analyzer" },
  { category: "Laboratory Equipment", name: "Centrifuge Machine" },
  { category: "Laboratory Equipment", name: "Lab Incubator" },
  { category: "Laboratory Equipment", name: "Lab Autoclave" },
  { category: "Laboratory Equipment", name: "Microscope" },
  { category: "Laboratory Equipment", name: "PCR Machine" },
  { category: "Laboratory Equipment", name: "ELISA Reader" },
  
  { category: "Surgical & OT Equipment", name: "Operation Table" },
  { category: "Surgical & OT Equipment", name: "Surgical Lights" },
  { category: "Surgical & OT Equipment", name: "Electrosurgical Unit (ESU)" },
  { category: "Surgical & OT Equipment", name: "Laparoscopy System" },
  { category: "Surgical & OT Equipment", name: "Endoscopy System" },
  { category: "Surgical & OT Equipment", name: "Cautery Machine" },
  { category: "Surgical & OT Equipment", name: "Surgical Drill" },
  { category: "Surgical & OT Equipment", name: "OT Lamp" },
  { category: "Surgical & OT Equipment", name: "OT Suction Machine" },
  { category: "Surgical & OT Equipment", name: "Harmonic Scalpel" },
  
  { category: "Dialysis & Nephrology", name: "Hemodialysis Machine" },
  { category: "Dialysis & Nephrology", name: "Peritoneal Dialysis Machine" },
  { category: "Dialysis & Nephrology", name: "Water Treatment System (RO Plant)" },
  { category: "Dialysis & Nephrology", name: "Dialysis Chair" },
  
  { category: "Neonatal & Pediatric", name: "Infant Incubator" },
  { category: "Neonatal & Pediatric", name: "Infant Warmer" },
  { category: "Neonatal & Pediatric", name: "Phototherapy Unit" },
  { category: "Neonatal & Pediatric", name: "Neonatal Ventilator" },
  { category: "Neonatal & Pediatric", name: "NICU Monitor" },
  { category: "Neonatal & Pediatric", name: "Bili Blanket" },
  
  { category: "Therapy & Rehabilitation", name: "Physiotherapy Equipment" },
  { category: "Therapy & Rehabilitation", name: "Traction Unit" },
  { category: "Therapy & Rehabilitation", name: "Short Wave Diathermy" },
  { category: "Therapy & Rehabilitation", name: "Ultrasound Therapy" },
  { category: "Therapy & Rehabilitation", name: "TENS Unit" },
  { category: "Therapy & Rehabilitation", name: "Exercise Equipment" },
  { category: "Therapy & Rehabilitation", name: "CPM Machine" },
  { category: "Therapy & Rehabilitation", name: "Laser Therapy Unit" },
  
  { category: "Sterilization & Disinfection", name: "Medical Autoclave" },
  { category: "Sterilization & Disinfection", name: "ETO Sterilizer" },
  { category: "Sterilization & Disinfection", name: "UV Sterilizer" },
  { category: "Sterilization & Disinfection", name: "Washer Disinfector" },
  
  { category: "Dental Equipment", name: "Dental Chair" },
  { category: "Dental Equipment", name: "Dental X-Ray Unit" },
  { category: "Dental Equipment", name: "Dental Autoclave" },
  { category: "Dental Equipment", name: "Dental Drill" },
  { category: "Dental Equipment", name: "Dental Scaler" },
  { category: "Dental Equipment", name: "Dental Compressor" },
  { category: "Dental Equipment", name: "Curing Light" },
  
  { category: "Other Equipment", name: "Other Equipment (Specify in description)" }
];

const patientConditions = [
  "Stable - Routine Transport",
  "Semi-Critical - Requires Monitoring",
  "Critical - ICU Transfer",
  "Emergency - Trauma/Accident",
  "Cardiac Emergency",
  "Stroke Patient",
  "Maternity - Labor",
  "Post-Surgery Transfer",
  "Respiratory Distress",
  "Unconscious Patient",
  "Other (Specify in description)"
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; 
  return Math.round(distance * 10) / 10; 
}

export default function ServiceBookingModal({ isOpen, onClose, service, serviceType }: ServiceBookingModalProps) {
  const { user } = useAuth();
  const { getPriceForService: getNursingPrice } = useNursingPrices();
  const { getPriceForService: getPhysiotherapyPrice } = usePhysiotherapyPrices();
  const { prices: ambulancePrices } = useAmbulancePrices();
  const [currentStep, setCurrentStep] = useState<"form" | "confirm">("form");
  const [formData, setFormData] = useState({
    patient_name: "",
    patient_contact: "",
    patient_email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    preferred_date: "",
    preferred_time: "",
    equipment_category: "",
    equipment_name: "",
    equipment_model: "",
    patient_condition: "",
    issue_description: "",
    urgency: "normal" as "normal" | "urgent" | "emergency",
    latitude: null as number | null,
    longitude: null as number | null,
    pickup_latitude: null as number | null,
    pickup_longitude: null as number | null,
    dropoff_latitude: null as number | null,
    dropoff_longitude: null as number | null,
    pickup_address: "",
    dropoff_address: "",
    rental_duration_days: "" as string,
    selected_equipment: [] as string[],
    billing_frequency: "per_visit" as "per_visit" | "monthly",
    monthly_visits_count: 1,
    is_extended_session: false,
    is_sunday_holiday: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string>("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showProfileFields, setShowProfileFields] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [nightDutyPercentage, setNightDutyPercentage] = useState(20);
  const [emergencyPercentage, setEmergencyPercentage] = useState(15);
  const [locationError, setLocationError] = useState("");

  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const serviceTitle = service.title.toLowerCase().trim();
  const showEquipment = !serviceTitle.includes("nursing") && 
                       !serviceTitle.includes("physiotherapy") && 
                       !serviceTitle.includes("physio") && 
                       !serviceTitle.includes("ambulance");
  const isAmbulance = serviceTitle.includes("ambulance");
  const isEquipmentRental = serviceTitle.includes("equipment") && serviceTitle.includes("rental");
  const isNursingService = serviceTitle.includes("nursing");
  const isPhysiotherapyService = serviceTitle.includes("physiotherapy") || serviceTitle.includes("physio");

  useEffect(() => {
    if (isAmbulance && formData.pickup_latitude && formData.pickup_longitude && 
        formData.dropoff_latitude && formData.dropoff_longitude) {
      const dist = calculateDistance(
        formData.pickup_latitude,
        formData.pickup_longitude,
        formData.dropoff_latitude,
        formData.dropoff_longitude
      );
      setDistance(dist);
    } else {
      setDistance(null);
    }
  }, [formData.pickup_latitude, formData.pickup_longitude, formData.dropoff_latitude, formData.dropoff_longitude, isAmbulance]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep("form");
      loadProfileData();
      loadDynamicPricingSettings();
    }
  }, [isOpen]);

  const loadDynamicPricingSettings = async () => {
    try {
      const nightRes = await fetch("/api/admin/dynamic-pricing/night-duty");
      const emergencyRes = await fetch("/api/admin/dynamic-pricing/emergency");
      
      if (nightRes.ok) {
        const data = await nightRes.json();
        setNightDutyPercentage(data.percentage || 20);
      }
      if (emergencyRes.ok) {
        const data = await emergencyRes.json();
        setEmergencyPercentage(data.percentage || 15);
      }
    } catch (error) {
      console.error("Error loading dynamic pricing settings:", error);
    }
  };

  const loadProfileData = async () => {
    setIsLoadingProfile(true);
    try {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; 
      const istTime = new Date(now.getTime() + istOffset);
      
      const currentDate = istTime.toISOString().split('T')[0];
      
      const hours = istTime.getUTCHours().toString().padStart(2, '0');
      const minutes = istTime.getUTCMinutes().toString().padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      const response = await fetch("/api/users/me", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        const profile = data.profile;
        
        // Debug: Log profile data to see what fields are available
        console.log("Profile data loaded:", {
          patient_address: profile?.patient_address,
          address: profile?.address,
          location: profile?.location,
          patient_pincode: profile?.patient_pincode,
          pincode: profile?.pincode,
          city: profile?.city,
          patient_city: profile?.patient_city
        });
        
        const userEmail = profile?.email || 
                          profile?.patient_email || 
                          (user as any)?.google_user_data?.email || 
                          (user as any)?.email || 
                          "";
        
        // Get address from multiple possible field names
        const userAddress = profile?.patient_address || 
                           profile?.address || 
                           profile?.location || 
                           "";
        
        // Get pincode from multiple possible field names
        const userPincode = profile?.patient_pincode || 
                           profile?.pincode || 
                           "";
        
        if (profile) {
          setFormData({
            patient_name: profile.patient_full_name || profile.full_name || "",
            patient_contact: profile.patient_contact || profile.phone || "",
            patient_email: userEmail,
            address: userAddress,
            city: profile.patient_city || profile.city || "",
            state: profile.state || "",
            pincode: userPincode,
            preferred_date: currentDate,
            preferred_time: currentTime,
            equipment_category: "",
            equipment_name: "",
            equipment_model: "",
            patient_condition: "",
            issue_description: "",
            urgency: "normal",
            latitude: profile.patient_latitude || profile.latitude || null,
            longitude: profile.patient_longitude || profile.longitude || null,
            pickup_latitude: null,
            pickup_longitude: null,
            dropoff_latitude: null,
            dropoff_longitude: null,
            pickup_address: "",
            dropoff_address: "",
            rental_duration_days: "",
            selected_equipment: [],
            billing_frequency: "per_visit",
            monthly_visits_count: 1,
            is_extended_session: false,
            is_sunday_holiday: false
          });
        }
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleEquipmentToggle = (equipmentName: string) => {
    const isSelected = formData.selected_equipment.includes(equipmentName);
    if (isSelected) {
      setFormData({
        ...formData,
        selected_equipment: formData.selected_equipment.filter(eq => eq !== equipmentName)
      });
    } else {
      setFormData({
        ...formData,
        selected_equipment: [...formData.selected_equipment, equipmentName]
      });
    }
  };

  const handleDurationQuickSelect = (days: number) => {
    setFormData({
      ...formData,
      rental_duration_days: days.toString()
    });
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData({
      ...formData,
      latitude: lat,
      longitude: lng
    });
  };

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAmbulance) {
      if (!formData.pickup_latitude || !formData.pickup_longitude || 
          !formData.dropoff_latitude || !formData.dropoff_longitude) {
        setLocationError("Please select both pickup and drop-off locations on the map to proceed");
        const locationSection = document.getElementById("ambulance-location-section");
        if (locationSection) {
          locationSection.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
    }
    
    setLocationError("");
    setCurrentStep("confirm");
  };

  const handleFinalSubmit = async () => {
    if (!formData.patient_name || !formData.patient_name.trim()) {
      setSubmitStatus("error");
      setSubmitErrorMessage("Please enter your name");
      return;
    }

    if (!formData.patient_contact || !formData.patient_contact.trim()) {
      setSubmitStatus("error");
      setSubmitErrorMessage("Please enter your contact number");
      return;
    }

    if (!formData.issue_description || !formData.issue_description.trim()) {
      setSubmitStatus("error");
      setSubmitErrorMessage("Please describe your service requirement");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setSubmitErrorMessage("");

    try {
      const response = await fetch("/api/bookings/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          service_type: serviceType.name,
          service_category: service.title,
          ...formData
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSubmitStatus("success");
        
        playBookingConfirmSound();
        
        setTimeout(() => {
          onClose();
          window.location.hash = `#searching-${data.order_id}`;
          window.location.reload();
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to submit booking request" }));
        setSubmitStatus("error");
        setSubmitErrorMessage(errorData.error || "Failed to submit booking request. Please try again.");
      }
    } catch (error) {
      console.error("Booking submission error:", error);
      setSubmitStatus("error");
      setSubmitErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentStep === "confirm") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-2xl w-full my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-4 sm:mb-6">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900">Confirm Your Booking</h3>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">Please review your details before submitting</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {submitStatus === "success" && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <div>
                <strong>Success!</strong> Your booking request has been submitted. A professional will contact you shortly.
              </div>
            </div>
          )}

          {submitStatus === "error" && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {submitErrorMessage || "Something went wrong. Please try again."}
            </div>
          )}

          <div className="space-y-4">
            {/* Service Summary */}
            <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Service Request</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600">Service Category:</span>
                  <span className="font-semibold text-gray-900 text-right">{service.title}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600">Service Type:</span>
                  <span className="font-semibold text-gray-900 text-right break-words">{serviceType.name}</span>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Your Details</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600 flex-shrink-0">Name:</span>
                  <span className="font-semibold text-gray-900 text-right break-words">{formData.patient_name}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600 flex-shrink-0">Contact:</span>
                  <span className="font-semibold text-gray-900 text-right">{formData.patient_contact}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600 flex-shrink-0">Email:</span>
                  <span className="font-semibold text-gray-900 text-right break-all">{formData.patient_email}</span>
                </div>
                {!isAmbulance && (
                  <>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-gray-600 flex-shrink-0">Address:</span>
                      <span className="font-semibold text-gray-900 sm:text-right break-words">{formData.address}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-gray-600 flex-shrink-0">Location:</span>
                      <span className="font-semibold text-gray-900 sm:text-right">{formData.city}, {formData.state} - {formData.pincode}</span>
                    </div>
                    {formData.latitude && formData.longitude && (
                      <div className="flex items-center gap-1 text-green-700">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium text-sm">GPS Location Marked</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Ambulance-specific info */}
            {isAmbulance && (
              <>
                {formData.patient_condition && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Ambulance className="w-5 h-5 text-red-600" />
                      Patient Condition
                    </h4>
                    <p className="text-sm font-semibold text-gray-900">{formData.patient_condition}</p>
                  </div>
                )}

                {distance !== null && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-gray-900">Estimated Distance</span>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-green-700">{distance} km</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      Pickup Location
                    </h4>
                    <p className="text-sm text-gray-700">{formData.pickup_address || "GPS coordinates marked"}</p>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      Drop-off Location
                    </h4>
                    <p className="text-sm text-gray-700">{formData.dropoff_address || "GPS coordinates marked"}</p>
                  </div>
                </div>
              </>
            )}

            {/* Equipment Details - Only if equipment was selected */}
            {showEquipment && (isEquipmentRental ? formData.selected_equipment.length > 0 : formData.equipment_name) && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-purple-600" />
                  Equipment Information
                </h4>
                <div className="space-y-2 text-sm">
                  {isEquipmentRental ? (
                    <>
                      <div>
                        <span className="text-gray-600 font-medium">Selected Equipment:</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {formData.selected_equipment.map((eq) => (
                            <span key={eq} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                      {formData.rental_duration_days && (
                        <div className="flex justify-between mt-3">
                          <span className="text-gray-600">Rental Duration:</span>
                          <span className="font-semibold text-gray-900">
                            {formData.rental_duration_days} {parseInt(formData.rental_duration_days) === 1 ? 'day' : 'days'}
                            {parseInt(formData.rental_duration_days) >= 7 && ` (${Math.floor(parseInt(formData.rental_duration_days) / 7)} ${Math.floor(parseInt(formData.rental_duration_days) / 7) === 1 ? 'week' : 'weeks'})`}
                            {parseInt(formData.rental_duration_days) >= 30 && ` (${Math.floor(parseInt(formData.rental_duration_days) / 30)} ${Math.floor(parseInt(formData.rental_duration_days) / 30) === 1 ? 'month' : 'months'})`}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-semibold text-gray-900">{formData.equipment_category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Equipment:</span>
                        <span className="font-semibold text-gray-900">{formData.equipment_name}</span>
                      </div>
                      {formData.equipment_model && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Model:</span>
                          <span className="font-semibold text-gray-900">{formData.equipment_model}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Schedule */}
            {(formData.preferred_date || formData.preferred_time) && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  Preferred Schedule
                </h4>
                <div className="space-y-2 text-sm">
                  {formData.preferred_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(formData.preferred_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {formData.preferred_time && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-semibold text-gray-900">{formData.preferred_time}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pricing Display - For nursing and physiotherapy */}
            {(isNursingService || isPhysiotherapyService) && (() => {
              const serviceNameVariations = [
                serviceType.name,
                serviceType.name.toLowerCase(),
                serviceType.name.toUpperCase(),
                serviceType.description,
                ...serviceType.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              ];
              
              let priceData = null;
              for (const name of serviceNameVariations) {
                priceData = isNursingService 
                  ? getNursingPrice(name)
                  : getPhysiotherapyPrice(name);
                if (priceData) break;
              }
              
              if (!priceData) {
                return (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Price information is being loaded. Please continue with booking.
                    </p>
                  </div>
                );
              }

              const basePrice = formData.billing_frequency === 'monthly' && priceData.monthly_price
                ? priceData.monthly_price
                : isNursingService 
                  ? (priceData as any).per_visit_price 
                  : (priceData as any).per_session_price;

              let tierAdjustment = 0;
              const cityLower = (formData.city || '').toLowerCase();
              if (cityLower.includes('vizag') || cityLower.includes('visakhapatnam') || 
                  cityLower.includes('vijayawada') || cityLower.includes('guntur')) {
                tierAdjustment = 20; 
              } else if (cityLower.includes('kakinada') || cityLower.includes('rajahmundry') || 
                         cityLower.includes('tirupati') || cityLower.includes('nellore')) {
                tierAdjustment = 10; 
              }

              const afterTier = Math.round(basePrice * (1 + tierAdjustment / 100));

              let isNightDuty = false;
              if (formData.preferred_time) {
                const hour = parseInt(formData.preferred_time.split(':')[0]);
                isNightDuty = hour >= 18 || hour < 7;
              }

              // Check if emergency/urgent
              const isEmergency = formData.urgency === 'emergency' || formData.urgency === 'urgent';

              let estimatedPrice = afterTier;
              const nightDutyCharge = isNightDuty && isNursingService ? Math.round(estimatedPrice * (nightDutyPercentage / 100)) : 0;
              if (nightDutyCharge > 0) {
                estimatedPrice += nightDutyCharge;
              }
              
              const emergencyCharge = isEmergency ? Math.round(estimatedPrice * (emergencyPercentage / 100)) : 0;
              if (emergencyCharge > 0) {
                estimatedPrice += emergencyCharge;
              }

              return (
                <>
                  {/* Billing Frequency */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Billing</h4>
                    <div className="flex items-center gap-3">
                      <div className={`px-4 py-2 rounded-lg font-semibold ${
                        formData.billing_frequency === "per_visit"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}>
                        {isNursingService ? "Per Visit" : "Per Session"}
                      </div>
                      {formData.billing_frequency === "monthly" && (
                        <>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                          <div className="px-4 py-2 rounded-lg font-semibold bg-green-500 text-white">
                            Monthly ({formData.monthly_visits_count} {isNursingService ? "visits" : "sessions"})
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Price Estimate */}
                  <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-green-600" />
                        Estimated Price
                      </h4>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-green-700">₹{estimatedPrice.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">
                          {formData.billing_frequency === 'monthly' ? 'per month' : isNursingService ? 'per visit' : 'per session'}
                        </p>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-2 text-sm border-t border-green-200 pt-3">
                      <div className="flex justify-between text-gray-700">
                        <span>Base Price (Tier-3):</span>
                        <span className="font-semibold">₹{basePrice.toLocaleString()}</span>
                      </div>
                      
                      {tierAdjustment > 0 && (
                        <div className="flex justify-between text-blue-700">
                          <span>City Tier Adjustment (+{tierAdjustment}%):</span>
                          <span className="font-semibold">₹{(afterTier - basePrice).toLocaleString()}</span>
                        </div>
                      )}

                      {isNightDuty && isNursingService && nightDutyCharge > 0 && (
                        <div className="flex justify-between text-purple-700">
                          <span>Night Duty (6 PM - 7 AM) (+{nightDutyPercentage}%):</span>
                          <span className="font-semibold">₹{nightDutyCharge.toLocaleString()}</span>
                        </div>
                      )}

                      {isEmergency && emergencyCharge > 0 && (
                        <div className="flex justify-between text-orange-700">
                          <span>Emergency/Urgent Service (+{emergencyPercentage}%):</span>
                          <span className="font-semibold">₹{emergencyCharge.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Additional Charges Notice */}
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs font-semibold text-yellow-900 mb-1">Additional Charges (Billed Separately):</p>
                      <ul className="text-xs text-yellow-800 space-y-1">
                        {isNursingService && (
                          <li>• Consumables (medicines, dressings, etc.) - as per actual usage</li>
                        )}
                        {isPhysiotherapyService && (
                          <>
                            <li>• Extended sessions beyond 60 minutes - as informed by physiotherapist</li>
                            <li>• Special equipment or therapy aids - if required</li>
                          </>
                        )}
                        <li>• {isNursingService ? "Nurse" : "Physiotherapist"} will inform you of any additional charges before service</li>
                      </ul>
                    </div>

                    <p className="text-xs text-gray-600 mt-3 text-center italic">
                      Final price will be confirmed by the service provider based on your specific requirements
                    </p>
                  </div>
                </>
              );
            })()}

            {/* Ambulance Pricing Display */}
            {isAmbulance && distance !== null && (() => {
              const ambulancePrice = ambulancePrices.find(p => p.service_name === serviceType.name);
              
              if (!ambulancePrice) return null;

              // Calculate base fare
              const extraKm = Math.max(0, distance - ambulancePrice.minimum_km);
              const extraKmCharge = Math.round(extraKm * ambulancePrice.per_km_charge);
              const baseFare = ambulancePrice.minimum_fare + extraKmCharge;

              // Calculate tier adjustment
              let tierAdjustment = 0;
              const pickupCity = formData.pickup_address.toLowerCase();
              if (pickupCity.includes('vizag') || pickupCity.includes('visakhapatnam') || 
                  pickupCity.includes('vijayawada') || pickupCity.includes('guntur')) {
                tierAdjustment = 20; // Tier-1: +20%
              } else if (pickupCity.includes('kakinada') || pickupCity.includes('rajahmundry') || 
                         pickupCity.includes('tirupati') || pickupCity.includes('nellore')) {
                tierAdjustment = 10; // Tier-2: +10%
              }

              const afterTier = Math.round(baseFare * (1 + tierAdjustment / 100));

              // Check for night service (6 PM - 7 AM)
              let isNightService = false;
              if (formData.preferred_time) {
                const hour = parseInt(formData.preferred_time.split(':')[0]);
                isNightService = hour >= 18 || hour < 7;
              }

              // Check for emergency dispatch
              const isEmergencyDispatch = formData.urgency === 'emergency' || formData.urgency === 'urgent';

              let estimatedFare = afterTier;
              const nightServiceCharge = isNightService ? Math.round(estimatedFare * (nightDutyPercentage / 100)) : 0;
              if (nightServiceCharge > 0) {
                estimatedFare += nightServiceCharge;
              }
              
              const emergencyDispatchCharge = isEmergencyDispatch ? Math.round(estimatedFare * (emergencyPercentage / 100)) : 0;
              if (emergencyDispatchCharge > 0) {
                estimatedFare += emergencyDispatchCharge;
              }

              return (
                <div className="p-5 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <IndianRupee className="w-5 h-5 text-red-600" />
                      Estimated Fare
                    </h4>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-red-700">₹{estimatedFare.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">one-way trip</p>
                    </div>
                  </div>

                  {/* Fare Breakdown */}
                  <div className="space-y-2 text-sm border-t border-red-200 pt-3">
                    <div className="flex justify-between text-gray-700">
                      <span>Minimum Fare (up to {ambulancePrice.minimum_km} km):</span>
                      <span className="font-semibold">₹{ambulancePrice.minimum_fare.toLocaleString()}</span>
                    </div>
                    
                    {extraKm > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Additional Distance ({extraKm.toFixed(1)} km × ₹{ambulancePrice.per_km_charge}):</span>
                        <span className="font-semibold">₹{extraKmCharge.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-700 pt-2 border-t border-red-200">
                      <span>Subtotal:</span>
                      <span className="font-semibold">₹{baseFare.toLocaleString()}</span>
                    </div>
                    
                    {tierAdjustment > 0 && (
                      <div className="flex justify-between text-blue-700">
                        <span>City Tier Adjustment (+{tierAdjustment}%):</span>
                        <span className="font-semibold">₹{(afterTier - baseFare).toLocaleString()}</span>
                      </div>
                    )}

                    {isNightService && nightServiceCharge > 0 && (
                      <div className="flex justify-between text-purple-700">
                        <span>Night Service (6 PM - 7 AM) (+{nightDutyPercentage}%):</span>
                        <span className="font-semibold">₹{nightServiceCharge.toLocaleString()}</span>
                      </div>
                    )}

                    {isEmergencyDispatch && emergencyDispatchCharge > 0 && (
                      <div className="flex justify-between text-orange-700">
                        <span>Emergency/Urgent Dispatch (+{emergencyPercentage}%):</span>
                        <span className="font-semibold">₹{emergencyDispatchCharge.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Additional Charges Notice */}
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs font-semibold text-yellow-900 mb-1">Additional Charges (If Applicable):</p>
                    <ul className="text-xs text-yellow-800 space-y-1">
                      <li>• Toll charges - as per actual toll gates</li>
                      <li>• Parking charges - if applicable</li>
                      <li>• Waiting time is not included in this fare</li>
                      <li>• Driver will inform you of any additional charges before departure</li>
                    </ul>
                  </div>

                  <p className="text-xs text-gray-600 mt-3 text-center italic">
                    Distance shown is estimated. Final fare based on actual distance traveled.
                  </p>
                </div>
              );
            })()}

            {/* Service Requirement */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                {isAmbulance ? "Additional Notes" : "Service Requirement"}
              </h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.issue_description}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-600">Urgency:</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  formData.urgency === "emergency" ? "bg-red-100 text-red-700" :
                  formData.urgency === "urgent" ? "bg-orange-100 text-orange-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {formData.urgency.charAt(0).toUpperCase() + formData.urgency.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <button
              onClick={() => setCurrentStep("form")}
              className="w-full sm:flex-1 px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all text-sm sm:text-base"
            >
              Edit Details
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className={`w-full sm:flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r ${service.gradient} text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Submitting...</span>
                  <span className="sm:hidden">Submit...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Confirm Booking</span>
                  <span className="sm:hidden">Confirm</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render form step
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-2xl w-full my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className={`text-lg sm:text-2xl font-bold bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent`}>
              Book {serviceType.name}
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm mt-1 break-words">{serviceType.description}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {isLoadingProfile && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
            Loading your profile information...
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Profile Summary - Always show with Edit option */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Your Details</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileFields(!showProfileFields)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {showProfileFields ? "Hide Details" : "Edit Details"}
              </button>
            </div>
            
            {!showProfileFields && (
              <div className="space-y-1 text-sm text-gray-700">
                <p><span className="font-medium">Name:</span> {formData.patient_name || "Not set"}</p>
                <p><span className="font-medium">Contact:</span> {formData.patient_contact || "Not set"}</p>
                <p><span className="font-medium">Email:</span> {user?.google_user_data?.email || "Not set"}</p>
                {!isAmbulance && (
                  <>
                    <p><span className="font-medium">Address:</span> {formData.address || "Not set"}</p>
                    <p><span className="font-medium">Location:</span> {formData.city ? `${formData.city}, ${formData.state} - ${formData.pincode}` : "Not set"}</p>
                    {formData.latitude && formData.longitude && (
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-green-600" />
                        <span className="font-medium text-green-700">GPS Location Marked</span>
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Expandable Profile Fields */}
          {showProfileFields && (
            <>
              {/* Personal Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.patient_name}
                      onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                    <input
                      type="tel"
                      value={formData.patient_contact}
                      onChange={(e) => setFormData({ ...formData, patient_contact: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                      <span className="text-xs text-gray-500 ml-2">(from your login account)</span>
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-gray-900 border border-gray-200">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <span>{user?.google_user_data?.email || formData.patient_email || "Not available"}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This email cannot be changed as it's linked to your login account</p>
                  </div>
                </div>
              </div>

              {/* Address Information - Only for non-ambulance */}
              {!isAmbulance && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Address & Location
                  </h4>
                  
                  {/* Interactive Map */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mark Your Location on Map
                      <span className="text-xs text-gray-500 ml-2">(click on map or use "Use My Location" button)</span>
                    </label>
                    <LocationMapPicker
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onLocationSelect={handleLocationSelect}
                      height="350px"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Street address, building name, flat no."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                        <input
                          type="text"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="State"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code *</label>
                        <input
                          type="text"
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="123456"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Ambulance-specific fields */}
          {isAmbulance && (
            <>
              {/* Patient Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Condition *</label>
                <select
                  value={formData.patient_condition}
                  onChange={(e) => setFormData({ ...formData, patient_condition: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select patient condition</option>
                  {patientConditions.map((condition) => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>

              {/* Location Picker Button */}
              <div id="ambulance-location-section" className="space-y-3">
                {/* Location Error Message */}
                {locationError && (
                  <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <p className="text-sm font-semibold text-red-800">{locationError}</p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className="w-full border-2 border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <div className="space-y-3">
                    {/* Pickup */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 ${formData.pickup_latitude ? "bg-green-500" : "border-2 border-green-500"} rounded-full`}></div>
                        <div className="w-0.5 h-6 bg-gray-300 my-1" style={{ borderStyle: 'dashed' }}></div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs text-gray-500 font-medium">PICKUP</p>
                        <p className={`text-sm ${formData.pickup_address ? "text-gray-900 font-medium" : "text-gray-400"} line-clamp-1`}>
                          {formData.pickup_address ? formData.pickup_address.split(',')[0] : "Select pickup location"}
                        </p>
                        {formData.pickup_address && (
                          <p className="text-xs text-gray-500 line-clamp-1">{formData.pickup_address}</p>
                        )}
                      </div>
                      {formData.pickup_latitude && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                    </div>

                    {/* Dropoff */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 ${formData.dropoff_latitude ? "bg-red-500" : "border-2 border-red-500"} rounded-full`}></div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs text-gray-500 font-medium">DROP-OFF</p>
                        <p className={`text-sm ${formData.dropoff_address ? "text-gray-900 font-medium" : "text-gray-400"} line-clamp-1`}>
                          {formData.dropoff_address ? formData.dropoff_address.split(',')[0] : "Select drop location"}
                        </p>
                        {formData.dropoff_address && (
                          <p className="text-xs text-gray-500 line-clamp-1">{formData.dropoff_address}</p>
                        )}
                      </div>
                      {formData.dropoff_latitude && <CheckCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                    </div>
                  </div>

                  {/* Select on map prompt */}
                  {(!formData.pickup_latitude || !formData.dropoff_latitude) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-2 text-blue-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">Tap to select locations on map</span>
                    </div>
                  )}
                </button>

                {/* Distance Display - shown after both locations selected */}
                {distance !== null && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Navigation className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Estimated Distance</p>
                          <p className="text-2xl font-bold text-gray-900">{distance} km</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLocationPicker(true)}
                        className="text-sm text-blue-600 font-semibold hover:text-blue-700"
                      >
                        View Route
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Full-screen Location Picker */}
              {showLocationPicker && (
                <AmbulanceLocationPicker
                  onComplete={(pickup, dropoff, dist) => {
                    setFormData({
                      ...formData,
                      pickup_latitude: pickup.lat,
                      pickup_longitude: pickup.lng,
                      pickup_address: pickup.address,
                      dropoff_latitude: dropoff.lat,
                      dropoff_longitude: dropoff.lng,
                      dropoff_address: dropoff.address
                    });
                    setDistance(dist);
                    setShowLocationPicker(false);
                  }}
                  onCancel={() => setShowLocationPicker(false)}
                  initialPickup={formData.pickup_latitude && formData.pickup_longitude ? {
                    lat: formData.pickup_latitude,
                    lng: formData.pickup_longitude,
                    address: formData.pickup_address
                  } : null}
                  initialDropoff={formData.dropoff_latitude && formData.dropoff_longitude ? {
                    lat: formData.dropoff_latitude,
                    lng: formData.dropoff_longitude,
                    address: formData.dropoff_address
                  } : null}
                />
              )}
            </>
          )}

          

          {/* Equipment Selection - Only for relevant services */}
          {showEquipment && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                Equipment Information
              </h4>
              
              {isEquipmentRental ? (
                <div className="space-y-4">
                  {/* Multiple Equipment Selection for Rental */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Equipment (Select Multiple) *
                    </label>
                    <p className="text-xs text-gray-600 mb-3">Click to select/deselect equipment items</p>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {/* Home Care Products Section */}
                      <div>
                        <h5 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-1">
                          🏠 Home Care Products
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {allMedicalEquipment
                            .filter(eq => eq.category === "Home Care Products")
                            .map((equipment) => (
                              <button
                                key={equipment.name}
                                type="button"
                                onClick={() => handleEquipmentToggle(equipment.name)}
                                className={`text-left px-3 py-2 rounded-lg border-2 transition-all ${
                                  formData.selected_equipment.includes(equipment.name)
                                    ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                                    : "border-gray-300 text-gray-700 hover:border-blue-400"
                                }`}
                              >
                                <span className="text-sm">{equipment.name}</span>
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Other Categories */}
                      {["Diagnostic Imaging", "Patient Monitoring", "Life Support & Critical Care", "Laboratory Equipment", "Surgical & OT Equipment", "Other Equipment"].map(category => {
                        const categoryEquipment = allMedicalEquipment.filter(eq => eq.category === category);
                        if (categoryEquipment.length === 0) return null;
                        
                        return (
                          <div key={category} className="pt-3 border-t border-gray-200">
                            <h5 className="font-semibold text-sm text-gray-900 mb-2">
                              {category}
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {categoryEquipment.map((equipment) => (
                                <button
                                  key={equipment.name}
                                  type="button"
                                  onClick={() => handleEquipmentToggle(equipment.name)}
                                  className={`text-left px-3 py-2 rounded-lg border-2 transition-all ${
                                    formData.selected_equipment.includes(equipment.name)
                                      ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                                      : "border-gray-300 text-gray-700 hover:border-blue-400"
                                  }`}
                                >
                                  <span className="text-sm">{equipment.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {formData.selected_equipment.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 mb-2">
                          Selected: {formData.selected_equipment.length} item(s)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {formData.selected_equipment.map((eq) => (
                            <span key={eq} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1">
                              {eq}
                              <button
                                type="button"
                                onClick={() => handleEquipmentToggle(eq)}
                                className="ml-1 hover:text-blue-900"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rental Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rental Duration *</label>
                    <p className="text-xs text-gray-600 mb-3">How many days do you need the equipment?</p>
                    
                    {/* Quick Select Buttons */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => handleDurationQuickSelect(7)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                          formData.rental_duration_days === "7"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-300 text-gray-700 hover:border-green-500"
                        }`}
                      >
                        1 Week
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDurationQuickSelect(14)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                          formData.rental_duration_days === "14"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-300 text-gray-700 hover:border-green-500"
                        }`}
                      >
                        2 Weeks
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDurationQuickSelect(30)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                          formData.rental_duration_days === "30"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-300 text-gray-700 hover:border-green-500"
                        }`}
                      >
                        1 Month
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDurationQuickSelect(60)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                          formData.rental_duration_days === "60"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-300 text-gray-700 hover:border-green-500"
                        }`}
                      >
                        2 Months
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDurationQuickSelect(90)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                          formData.rental_duration_days === "90"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-300 text-gray-700 hover:border-green-500"
                        }`}
                      >
                        3 Months
                      </button>
                    </div>

                    {/* Custom Days Input */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Or enter custom number of days:</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.rental_duration_days}
                        onChange={(e) => setFormData({ ...formData, rental_duration_days: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter number of days"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Equipment *</label>
                    <select
                      value={formData.equipment_name}
                      onChange={(e) => {
                        const selected = allMedicalEquipment.find(eq => eq.name === e.target.value);
                        setFormData({ 
                          ...formData, 
                          equipment_name: e.target.value,
                          equipment_category: selected?.category || ""
                        });
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose your equipment</option>
                      
                      <optgroup label="🏠 Home Care Products (Quick Access)">
                        {allMedicalEquipment
                          .filter(eq => eq.category === "Home Care Products")
                          .map((equipment) => (
                            <option key={equipment.name} value={equipment.name}>
                              {equipment.name}
                            </option>
                          ))}
                      </optgroup>
                      
                      <optgroup label="🏥 Hospital & Clinical Equipment">
                        {allMedicalEquipment
                          .filter(eq => eq.category !== "Home Care Products" && eq.category !== "Other Equipment")
                          .map((equipment) => (
                            <option key={equipment.name} value={equipment.name}>
                              {equipment.name} ({equipment.category})
                            </option>
                          ))}
                      </optgroup>
                      
                      <optgroup label="Other">
                        {allMedicalEquipment
                          .filter(eq => eq.category === "Other Equipment")
                          .map((equipment) => (
                            <option key={equipment.name} value={equipment.name}>
                              {equipment.name}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>

                  {formData.equipment_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Equipment Model/Make (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.equipment_model}
                        onChange={(e) => setFormData({ ...formData, equipment_model: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., GE Vivid E95, Philips MX400"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Appointment Preference - Only for non-ambulance */}
          {!isAmbulance && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Preferred Schedule
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Default set to current Indian time. Change if you prefer a different time.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                  <input
                    type="time"
                    value={formData.preferred_time}
                    onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Billing Frequency - For nursing and physiotherapy services */}
          {(isNursingService || isPhysiotherapyService) && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Billing Frequency
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, billing_frequency: "per_visit", monthly_visits_count: 1 })}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.billing_frequency === "per_visit"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-bold text-gray-900">Per Visit</h5>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.billing_frequency === "per_visit"
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}>
                      {formData.billing_frequency === "per_visit" && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Pay per individual visit or service session</p>
                  <p className="text-xs text-gray-500 mt-2">Flexible, no commitment</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, billing_frequency: "monthly", monthly_visits_count: 30 })}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.billing_frequency === "monthly"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-green-400"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-bold text-gray-900">Monthly Package</h5>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.billing_frequency === "monthly"
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}>
                      {formData.billing_frequency === "monthly" && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Monthly package with daily visits</p>
                  <p className="text-xs font-semibold text-green-700 mt-2">Save with monthly rate</p>
                </button>
              </div>

              {/* Monthly visit frequency selector */}
              {formData.billing_frequency === "monthly" && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isNursingService ? "How many visits per month?" : "How many sessions per month?"}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, monthly_visits_count: 15 })}
                      className={`px-3 py-2 rounded-lg border-2 font-medium transition-all ${
                        formData.monthly_visits_count === 15
                          ? "border-green-500 bg-white text-green-700"
                          : "border-gray-300 text-gray-700 hover:border-green-500"
                      }`}
                    >
                      15 {isNursingService ? "visits" : "sessions"}
                      <span className="block text-xs text-gray-600">Alternate days</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, monthly_visits_count: 30 })}
                      className={`px-3 py-2 rounded-lg border-2 font-medium transition-all ${
                        formData.monthly_visits_count === 30
                          ? "border-green-500 bg-white text-green-700"
                          : "border-gray-300 text-gray-700 hover:border-green-500"
                      }`}
                    >
                      30 {isNursingService ? "visits" : "sessions"}
                      <span className="block text-xs text-gray-600">Daily</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, monthly_visits_count: 60 })}
                      className={`px-3 py-2 rounded-lg border-2 font-medium transition-all ${
                        formData.monthly_visits_count === 60
                          ? "border-green-500 bg-white text-green-700"
                          : "border-gray-300 text-gray-700 hover:border-green-500"
                      }`}
                    >
                      60 {isNursingService ? "visits" : "sessions"}
                      <span className="block text-xs text-gray-600">Twice daily</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, monthly_visits_count: 90 })}
                      className={`px-3 py-2 rounded-lg border-2 font-medium transition-all ${
                        formData.monthly_visits_count === 90
                          ? "border-green-500 bg-white text-green-700"
                          : "border-gray-300 text-gray-700 hover:border-green-500"
                      }`}
                    >
                      90 {isNursingService ? "visits" : "sessions"}
                      <span className="block text-xs text-gray-600">3x daily</span>
                    </button>
                  </div>
                </div>
              )}


            </div>
          )}

          {/* Service Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isAmbulance ? "Additional Notes" : "Describe your requirement"} *
            </label>
            <textarea
              value={formData.issue_description}
              onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={isAmbulance 
                ? "Any additional information (medical equipment needed, special requirements, etc.)"
                : "Please provide details about the service you need..."}
            />
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, urgency: "normal" })}
                className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  formData.urgency === "normal"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 text-gray-700 hover:border-green-500"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, urgency: "urgent" })}
                className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  formData.urgency === "urgent"
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-300 text-gray-700 hover:border-orange-500"
                }`}
              >
                Urgent
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, urgency: "emergency" })}
                className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                  formData.urgency === "emergency"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-300 text-gray-700 hover:border-red-500"
                }`}
              >
                Emergency
              </button>
            </div>
          </div>

          {/* Next Button */}
          <button
            type="submit"
            className={`w-full px-4 sm:px-6 py-3 bg-gradient-to-r ${service.gradient} text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base`}
          >
            <span className="hidden sm:inline">Review Booking</span>
            <span className="sm:hidden">Continue</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
