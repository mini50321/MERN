import { X } from "lucide-react";
import { useNursingPrices } from "@/react-app/hooks/useNursingPrices";
import { usePhysiotherapyPrices } from "@/react-app/hooks/usePhysiotherapyPrices";
import { useAmbulancePrices } from "@/react-app/hooks/useAmbulancePrices";

interface ServiceType {
  id: number;
  name: string;
  description: string;
}

interface ServiceTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    title: string;
    gradient: string;
  };
  onSelectType: (type: ServiceType) => void;
}

export default function ServiceTypeSelectionModal({
  isOpen,
  onClose,
  service,
  onSelectType
}: ServiceTypeSelectionModalProps) {
  const { loading: nursingPricesLoading, getPriceForService: getNursingPrice } = useNursingPrices();
  const { loading: physioPricesLoading, getPriceForService: getPhysioPrice } = usePhysiotherapyPrices();
  const { prices: ambulancePrices, isLoading: ambulancePricesLoading } = useAmbulancePrices();
  
  const isNursing = service.title === "Nursing Services";
  const isPhysiotherapy = service.title === "Physiotherapy";
  const isAmbulance = service.title === "Ambulance Services";
  const pricesLoading = isNursing ? nursingPricesLoading : isPhysiotherapy ? physioPricesLoading : isAmbulance ? ambulancePricesLoading : false;
  const getPriceForService = isNursing ? getNursingPrice : isPhysiotherapy ? getPhysioPrice : () => null;
  
  if (!isOpen) return null;

  const getServiceTypes = (): ServiceType[] => {
    switch (service.title) {
      case "Ambulance Services":
        return [
          {
            id: 1,
            name: "Basic Ambulance (Non-Emergency)",
            description: "From home to hospital or hospital to home"
          },
          {
            id: 2,
            name: "Emergency Ambulance",
            description: "Oxygen support, trained staff"
          },
          {
            id: 3,
            name: "ICU Ambulance",
            description: "Ventilator, cardiac monitor, critical care"
          },
          {
            id: 4,
            name: "Dead Body / Mortuary Ambulance",
            description: "Mortuary transport services"
          }
        ];
      
      case "Biomedical Engineering":
        return [
          {
            id: 1,
            name: "Equipment Installation",
            description: "Professional installation and setup of medical equipment and devices"
          },
          {
            id: 2,
            name: "Equipment Repair",
            description: "Expert repair services for malfunctioning medical equipment"
          },
          {
            id: 3,
            name: "Preventive Maintenance",
            description: "Regular maintenance to ensure optimal equipment performance and longevity"
          },
          {
            id: 4,
            name: "Calibration Services",
            description: "Precision calibration to ensure accurate equipment readings and measurements"
          },
          {
            id: 5,
            name: "Technical Consultation",
            description: "Expert advice on equipment selection, upgrades, and optimization"
          }
        ];
      
      case "Nursing Services":
        return [
          // TASK-BASED SERVICES
          {
            id: 1,
            name: "Injection / IV / Simple Procedure",
            description: "IM/IV/SC injection, basic assistance"
          },
          {
            id: 2,
            name: "Vitals Check",
            description: "BP, Sugar, SpO₂ monitoring"
          },
          {
            id: 3,
            name: "Wound Dressing",
            description: "Simple wounds (consumables extra)"
          },
          {
            id: 4,
            name: "Catheter / Ryles Tube Care",
            description: "Insertion, change, cleaning"
          },
          {
            id: 5,
            name: "Nebulization / Oxygen Monitoring",
            description: "Respiratory therapy and oxygen support"
          },
          
          // CARE-BASED HOME NURSING
          {
            id: 6,
            name: "General Home Nursing Visit",
            description: "Post-op care, medicines, hygiene, monitoring"
          },
          {
            id: 7,
            name: "Post-Operative Home Nursing",
            description: "Specialized recovery support after surgery"
          },
          {
            id: 8,
            name: "Elderly Care Nursing (Day Shift)",
            description: "Up to 8 hours daily support"
          },
          {
            id: 9,
            name: "24-Hour Elderly Nursing (Live-in)",
            description: "Full-time residential care"
          },
          {
            id: 10,
            name: "Pediatric / Newborn Nursing",
            description: "Specialized infant/child care"
          }
        ];
      
      case "Physiotherapy":
        return [
          {
            id: 1,
            name: "Basic Physiotherapy Session (Home Visit)",
            description: "General musculoskeletal treatment and rehabilitation"
          },
          {
            id: 2,
            name: "Post-Operative Physiotherapy",
            description: "Specialized recovery support after surgery"
          },
          {
            id: 3,
            name: "Stroke / Neuro Rehabilitation",
            description: "Recovery from stroke, spinal injury, or neurological conditions"
          },
          {
            id: 4,
            name: "Elderly Physiotherapy",
            description: "Mobility training and fall prevention for seniors"
          },
          {
            id: 5,
            name: "Orthopedic Pain Management",
            description: "Treatment for joint, bone, and muscle pain"
          },
          {
            id: 6,
            name: "Pediatric Physiotherapy",
            description: "Specialized therapy for infants and children"
          },
          {
            id: 7,
            name: "Respiratory Physiotherapy",
            description: "Breathing exercises and chest physiotherapy"
          }
        ];
      
      case "Equipment Rental":
        return [
          {
            id: 1,
            name: "Wheelchair & Mobility Aids",
            description: "Manual and electric wheelchairs, walkers, and mobility assistance devices"
          },
          {
            id: 2,
            name: "Hospital Bed Rental",
            description: "Adjustable hospital beds with side rails for home care"
          },
          {
            id: 3,
            name: "Oxygen Concentrator",
            description: "Medical-grade oxygen concentrators for respiratory support"
          },
          {
            id: 4,
            name: "Patient Monitoring Equipment",
            description: "BP monitors, pulse oximeters, glucometers, and vital signs monitors"
          },
          {
            id: 5,
            name: "Nebulizer & Respiratory Aids",
            description: "Nebulizers, CPAP machines, and respiratory therapy equipment"
          }
        ];
      
      default:
        return [];
    }
  };

  const serviceTypes = getServiceTypes();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-2xl font-bold bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent`}>
              {service.title}
            </h3>
            <p className="text-gray-600 text-sm mt-1">Select the specific service you need</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Show categorized view for Nursing Services */}
          {service.title === "Nursing Services" ? (
            <>
              {/* Important Pricing Information */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">₹</span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-amber-900 mb-2">Pricing Information</h5>
                    <p className="text-sm text-amber-800 mb-2">Prices shown are base rates. Additional charges apply for:</p>
                    <ul className="text-xs text-amber-700 space-y-1">
                      <li>• <strong>Night duty (8 PM - 6 AM):</strong> +20% automatic surcharge</li>
                      <li>• <strong>Emergency/Urgent calls:</strong> +15% automatic surcharge</li>
                      <li>• <strong>City location:</strong> Prices vary by city tier (applied automatically)</li>
                      <li>• <strong>Medical consumables:</strong> Billed separately (bandages, medicines, etc.)</li>
                    </ul>
                    <p className="text-xs text-amber-800 mt-2 font-semibold">Final price will be calculated and shown before you confirm your booking.</p>
                  </div>
                </div>
              </div>

              {/* Task-Based Services */}
              <div>
                <div className="mb-3 pb-2 border-b-2 border-blue-200">
                  <h4 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                    💉 Task-Based Services
                    <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Quick & Affordable
                    </span>
                  </h4>
                  <p className="text-xs text-blue-700 mt-1">One-time visits for specific medical tasks</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pricesLoading ? (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      Loading prices...
                    </div>
                  ) : (
                    serviceTypes.slice(0, 5).map((type) => {
                      const priceData = getPriceForService(type.name) as any;
                      return (
                        <div
                          key={type.id}
                          className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border-2 border-blue-200 hover:border-blue-500 transition-all hover:shadow-lg cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-base font-bold text-gray-900 flex-1">{type.name}</h4>
                            <span className="text-lg font-bold text-blue-700 whitespace-nowrap ml-2">
                              ₹{priceData?.per_visit_price || 0}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-4 leading-relaxed">{priceData?.description || type.description}</p>
                          <button
                            onClick={() => onSelectType(type)}
                            className={`w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm`}
                          >
                            Book Now
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Care-Based Nursing */}
              <div>
                <div className="mb-3 pb-2 border-b-2 border-green-200">
                  <h4 className="text-lg font-bold text-green-900 flex items-center gap-2">
                    🏠 Care-Based Home Nursing
                    <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      Comprehensive Care
                    </span>
                  </h4>
                  <p className="text-xs text-green-700 mt-1">Ongoing nursing support at home</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pricesLoading ? (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      Loading prices...
                    </div>
                  ) : (
                    serviceTypes.slice(5, 10).map((type) => {
                      const priceData = getPriceForService(type.name) as any;
                      return (
                        <div
                          key={type.id}
                          className="bg-gradient-to-br from-green-50 to-white rounded-xl p-5 border-2 border-green-200 hover:border-green-500 transition-all hover:shadow-lg cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-base font-bold text-gray-900 flex-1">{type.name}</h4>
                            <div className="text-right ml-2">
                              {priceData?.per_visit_price && (
                                <span className="text-sm font-bold text-green-700 block">
                                  ₹{priceData.per_visit_price}/visit
                                </span>
                              )}
                              {priceData?.monthly_price && (
                                <span className="text-lg font-bold text-green-700 block">
                                  ₹{priceData.monthly_price.toLocaleString()}/mo
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-4 leading-relaxed">{priceData?.description || type.description}</p>
                          <button
                            onClick={() => onSelectType(type)}
                            className={`w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm`}
                          >
                            Book Now
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>


            </>
          ) : service.title === "Physiotherapy" ? (
            /* Physiotherapy with fixed pricing */
            <>
              {/* Pricing Information */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">₹</span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-purple-900 mb-2">Pricing Information</h5>
                    <p className="text-sm text-purple-800 mb-2">Prices shown are base rates. Additional charges apply for:</p>
                    <ul className="text-xs text-purple-700 space-y-1">
                      <li>• <strong>Sunday or public holiday:</strong> +10% automatic surcharge</li>
                      <li>• <strong>Emergency same-day booking:</strong> +15% automatic surcharge</li>
                      <li>• <strong>Extended session duration:</strong> +10% for sessions over 60 minutes</li>
                      <li>• <strong>City location:</strong> Prices vary by city tier (applied automatically)</li>
                    </ul>
                    <p className="text-xs text-purple-800 mt-2 font-semibold">Final price will be calculated and shown before you confirm your booking.</p>
                  </div>
                </div>
              </div>

              {/* Session-Based Services */}
              <div className="mb-6">
                <div className="mb-3 pb-2 border-b-2 border-purple-200">
                  <h4 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                    🏥 Session-Based Services
                    <span className="text-xs font-normal text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                      Per Session
                    </span>
                  </h4>
                  <p className="text-xs text-purple-700 mt-1">Individual treatment sessions</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pricesLoading ? (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      Loading prices...
                    </div>
                  ) : (
                    serviceTypes.filter(t => t.id === 1 || t.id === 5 || t.id === 7).map((type) => {
                      const priceData = getPriceForService(type.name) as any;
                      return (
                        <div
                          key={type.id}
                          className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-5 border-2 border-purple-200 hover:border-purple-500 transition-all hover:shadow-lg cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-base font-bold text-gray-900 flex-1">{type.name}</h4>
                            <span className="text-lg font-bold text-purple-700 whitespace-nowrap ml-2">
                              ₹{priceData?.per_session_price || 0}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-4 leading-relaxed">{priceData?.description || type.description}</p>
                          <button
                            onClick={() => onSelectType(type)}
                            className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                          >
                            Book Now
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Monthly Rehabilitation Packages */}
              <div>
                <div className="mb-3 pb-2 border-b-2 border-indigo-200">
                  <h4 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                    📅 Monthly Rehabilitation Packages
                    <span className="text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                      Ongoing Care
                    </span>
                  </h4>
                  <p className="text-xs text-indigo-700 mt-1">Comprehensive monthly treatment plans</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pricesLoading ? (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      Loading prices...
                    </div>
                  ) : (
                    serviceTypes.filter(t => t.id === 2 || t.id === 3 || t.id === 4 || t.id === 6).map((type) => {
                      const priceData = getPriceForService(type.name) as any;
                      return (
                        <div
                          key={type.id}
                          className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-5 border-2 border-indigo-200 hover:border-indigo-500 transition-all hover:shadow-lg cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-base font-bold text-gray-900 flex-1">{type.name}</h4>
                            <div className="text-right ml-2">
                              {priceData?.per_session_price && (
                                <span className="text-sm font-bold text-indigo-700 block">
                                  ₹{priceData.per_session_price}/session
                                </span>
                              )}
                              {priceData?.monthly_price && (
                                <span className="text-lg font-bold text-indigo-700 block">
                                  ₹{priceData.monthly_price.toLocaleString()}/mo
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-4 leading-relaxed">{priceData?.description || type.description}</p>
                          <button
                            onClick={() => onSelectType(type)}
                            className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                          >
                            Book Now
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          ) : service.title === "Ambulance Services" ? (
            /* Ambulance Services with distance-based pricing */
            <>
              {/* Pricing Information */}
              <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">₹</span>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-red-900 mb-2">Distance-Based Pricing</h5>
                    <p className="text-sm text-red-800 mb-2">Minimum fare includes first 5 km. Additional km charged separately.</p>
                    <ul className="text-xs text-red-700 space-y-1">
                      <li>• <strong>Distance calculated:</strong> One-way only</li>
                      <li>• <strong>Night service (10 PM - 6 AM):</strong> +20% automatic surcharge</li>
                      <li>• <strong>Emergency dispatch (within 30 mins):</strong> +15% automatic surcharge</li>
                      <li>• <strong>City location:</strong> Prices vary by city tier (applied automatically)</li>
                      <li>• <strong>Toll & parking:</strong> Billed separately if applicable</li>
                    </ul>
                    <p className="text-xs text-red-800 mt-2 font-semibold">Final fare will be calculated based on actual distance traveled.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pricesLoading ? (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    Loading prices...
                  </div>
                ) : (
                  ambulancePrices.map((priceData) => (
                    <div
                      key={priceData.id}
                      className="bg-gradient-to-br from-red-50 to-white rounded-xl p-5 border-2 border-red-200 hover:border-red-500 transition-all hover:shadow-lg cursor-pointer"
                    >
                      <div className="mb-3">
                        <h4 className="text-base font-bold text-gray-900 mb-1">{priceData.service_name}</h4>
                        <p className="text-xs text-gray-600 leading-relaxed">{priceData.description}</p>
                      </div>
                      
                      <div className="mb-4 p-3 bg-white border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600">Minimum fare (up to {priceData.minimum_km} km)</span>
                          <span className="text-lg font-bold text-red-700">₹{priceData.minimum_fare}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <span className="text-xs text-gray-600">Additional per km</span>
                          <span className="text-sm font-bold text-red-600">₹{priceData.per_km_charge}/km</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectType({ 
                          id: priceData.id, 
                          name: priceData.service_name, 
                          description: priceData.description 
                        })}
                        className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                      >
                        Book Now
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Default grid layout for other services */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceTypes.map((type) => (
                <div
                  key={type.id}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 hover:border-teal-500 transition-all hover:shadow-lg"
                >
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{type.name}</h4>
                  <p className="text-sm text-gray-600 mb-4">{type.description}</p>
                  <button
                    onClick={() => onSelectType(type)}
                    className={`w-full px-4 py-2 bg-gradient-to-r ${service.gradient} text-white rounded-lg font-semibold hover:shadow-lg transition-all`}
                  >
                    Request
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
