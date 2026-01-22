import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import { MapPin, ArrowLeft, Navigation, Search } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom marker icons
const createCustomIcon = (color: string, isLarge: boolean = false) => {
  const size = isLarge ? 40 : 30;
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
      <svg width="${size/2}" height="${size/2}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
  });
};

const pickupIcon = createCustomIcon('#22c55e', true); // Green
const dropoffIcon = createCustomIcon('#ef4444', true); // Red

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface AmbulanceLocationPickerProps {
  onComplete: (pickup: LocationData, dropoff: LocationData, distance: number) => void;
  onCancel: () => void;
  initialPickup?: LocationData | null;
  initialDropoff?: LocationData | null;
}

// Map center marker (fixed position)
function CenterMarker({ color }: { color: string }) {
  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none">
      <div 
        style={{ backgroundColor: color }}
        className="w-10 h-10 rounded-full border-3 border-white shadow-lg flex items-center justify-center"
      >
        <MapPin className="w-5 h-5 text-white" />
      </div>
      {/* Pin shadow */}
      <div className="w-3 h-1 bg-black/30 rounded-full mx-auto -mt-1 blur-sm"></div>
    </div>
  );
}

// Component to handle map center changes
function MapCenterTracker({ onCenterChange }: { onCenterChange: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    },
  });
  
  return null;
}

// Component to fly to location
function MapFlyer({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], zoom || 15, { duration: 0.5 });
    }
  }, [lat, lng, zoom, map]);
  
  return null;
}

// Calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function AmbulanceLocationPicker({
  onComplete,
  onCancel,
  initialPickup,
  initialDropoff
}: AmbulanceLocationPickerProps) {
  const [step, setStep] = useState<"pickup" | "dropoff" | "route">(initialPickup ? (initialDropoff ? "route" : "dropoff") : "pickup");
  const [pickup, setPickup] = useState<LocationData | null>(initialPickup || null);
  const [dropoff, setDropoff] = useState<LocationData | null>(initialDropoff || null);
  const [currentCenter, setCurrentCenter] = useState<{ lat: number; lng: number }>({ lat: 20.5937, lng: 78.9629 });
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  // Get user's current location on mount
  useEffect(() => {
    if (!initialPickup && navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentCenter({ lat: latitude, lng: longitude });
          setMapKey(prev => prev + 1);
          setIsGettingLocation(false);
        },
        () => {
          setIsGettingLocation(false);
        }
      );
    }
  }, [initialPickup]);

  // Reverse geocode current center
  useEffect(() => {
    const fetchAddress = async () => {
      if (step === "route") return;
      
      setIsLoadingAddress(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${currentCenter.lat}&lon=${currentCenter.lng}&format=json&addressdetails=1`,
          { headers: { "User-Agent": "MavyApp/1.0" } }
        );
        const data = await response.json();
        setCurrentAddress(data.display_name || `${currentCenter.lat.toFixed(6)}, ${currentCenter.lng.toFixed(6)}`);
      } catch (error) {
        setCurrentAddress(`${currentCenter.lat.toFixed(6)}, ${currentCenter.lng.toFixed(6)}`);
      } finally {
        setIsLoadingAddress(false);
      }
    };

    const timeoutId = setTimeout(fetchAddress, 500);
    return () => clearTimeout(timeoutId);
  }, [currentCenter, step]);

  // Search for addresses
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)},India&format=json&limit=5&addressdetails=1`,
        { headers: { "User-Agent": "MavyApp/1.0" } }
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSelect = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setCurrentCenter({ lat, lng });
    setCurrentAddress(result.display_name);
    setSearchResults([]);
    setSearchQuery("");
    setShowSearch(false);
    setMapKey(prev => prev + 1);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentCenter({ lat: latitude, lng: longitude });
        setMapKey(prev => prev + 1);
        setIsGettingLocation(false);
      },
      () => {
        alert("Unable to get location");
        setIsGettingLocation(false);
      }
    );
  };

  const handleConfirmPickup = () => {
    setPickup({
      lat: currentCenter.lat,
      lng: currentCenter.lng,
      address: currentAddress
    });
    setStep("dropoff");
    setShowSearch(false);
    setSearchQuery("");
  };

  const handleConfirmDropoff = () => {
    const newDropoff = {
      lat: currentCenter.lat,
      lng: currentCenter.lng,
      address: currentAddress
    };
    setDropoff(newDropoff);
    setStep("route");
  };

  const handleConfirmRoute = () => {
    if (pickup && dropoff) {
      const distance = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
      onComplete(pickup, dropoff, distance);
    }
  };

  const handleBack = () => {
    if (step === "dropoff") {
      setStep("pickup");
      if (pickup) {
        setCurrentCenter({ lat: pickup.lat, lng: pickup.lng });
        setMapKey(prev => prev + 1);
      }
    } else if (step === "route") {
      setStep("dropoff");
      if (dropoff) {
        setCurrentCenter({ lat: dropoff.lat, lng: dropoff.lng });
        setMapKey(prev => prev + 1);
      }
    } else {
      onCancel();
    }
  };

  const distance = pickup && dropoff ? calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng) : null;

  // Render route preview
  if (step === "route" && pickup && dropoff) {
    const bounds = L.latLngBounds(
      [pickup.lat, pickup.lng],
      [dropoff.lat, dropoff.lng]
    );
    const center = bounds.getCenter();

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button onClick={handleBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Confirm Route</h2>
        </div>

        {/* Map with route */}
        <div className="flex-1 relative">
          <MapContainer
            key={`route-${mapKey}`}
            center={[center.lat, center.lng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />
            <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon} />
            <Polyline
              positions={[[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]}
              color="#1e40af"
              weight={4}
              opacity={0.8}
            />
            <MapFlyer lat={center.lat} lng={center.lng} zoom={12} />
          </MapContainer>

          {/* Current location button */}
          <button
            onClick={handleUseCurrentLocation}
            className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center z-[1000] border border-gray-200"
          >
            <Navigation className="w-5 h-5 text-blue-600" />
          </button>
        </div>

        {/* Bottom panel */}
        <div className="bg-white border-t border-gray-200 p-4 space-y-4">
          {/* Distance info */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-sm text-blue-900 font-medium">Estimated Distance</span>
            <span className="text-xl font-bold text-blue-700">{distance} km</span>
          </div>

          {/* Location summary */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Pickup */}
            <div className="flex items-start gap-3 p-3 border-b border-gray-100">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow"></div>
                <div className="w-0.5 h-8 bg-gray-300 my-1" style={{ borderStyle: 'dashed' }}></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">PICKUP</p>
                <p className="text-sm text-gray-900 font-semibold line-clamp-2">{pickup.address}</p>
              </div>
              <button 
                onClick={() => { setStep("pickup"); setCurrentCenter({ lat: pickup.lat, lng: pickup.lng }); setMapKey(k => k+1); }}
                className="text-xs text-blue-600 font-semibold"
              >
                Change
              </button>
            </div>
            
            {/* Dropoff */}
            <div className="flex items-start gap-3 p-3">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">DROP-OFF</p>
                <p className="text-sm text-gray-900 font-semibold line-clamp-2">{dropoff.address}</p>
              </div>
              <button 
                onClick={() => { setStep("dropoff"); setCurrentCenter({ lat: dropoff.lat, lng: dropoff.lng }); setMapKey(k => k+1); }}
                className="text-xs text-blue-600 font-semibold"
              >
                Change
              </button>
            </div>
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirmRoute}
            className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold text-lg rounded-xl transition-colors shadow-md"
          >
            Confirm Locations
          </button>
        </div>
      </div>
    );
  }

  // Render pickup/dropoff selection
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header with search */}
      {showSearch ? (
        <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowSearch(false); setSearchResults([]); setSearchQuery(""); }} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search for a location"
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-1">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSearchSelect(result)}
                  className="w-full text-left px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className={`w-5 h-5 mt-0.5 flex-shrink-0 ${step === "pickup" ? "text-green-600" : "text-red-600"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {result.address?.road || result.address?.suburb || result.name || "Location"}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2">{result.display_name}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {isSearching && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button onClick={handleBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">
            {step === "pickup" ? "Select Pickup Location" : "Select Drop Location"}
          </h2>
        </div>
      )}

      {/* Location input fields (shown when not searching) */}
      {!showSearch && (
        <div className="bg-white px-4 py-3 border-b border-gray-200">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Pickup field */}
            <button
              onClick={() => {
                if (step === "dropoff" && pickup) {
                  setStep("pickup");
                  setCurrentCenter({ lat: pickup.lat, lng: pickup.lng });
                  setMapKey(prev => prev + 1);
                }
              }}
              className={`w-full flex items-start gap-3 p-3 text-left ${step === "pickup" ? "bg-green-50" : "bg-white"}`}
            >
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 ${pickup ? "bg-green-500" : "border-2 border-green-500"} rounded-full`}></div>
                <div className="w-0.5 h-6 bg-gray-300 my-1" style={{ borderStyle: 'dashed' }}></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${pickup ? "text-gray-900 font-medium" : "text-gray-500"} line-clamp-1`}>
                  {pickup ? pickup.address.split(',')[0] : "Select pickup location"}
                </p>
                {pickup && <p className="text-xs text-gray-500 line-clamp-1">{pickup.address}</p>}
              </div>
              {step === "pickup" && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
            </button>

            {/* Dropoff field */}
            <button
              onClick={() => {
                if (step === "pickup" && !pickup) {
                  // Need to select pickup first
                  return;
                }
                if (step === "pickup" && pickup) {
                  // Skip to dropoff selection
                  handleConfirmPickup();
                  return;
                }
                setShowSearch(true);
              }}
              className={`w-full flex items-start gap-3 p-3 text-left border-t border-gray-100 ${step === "dropoff" ? "bg-red-50" : "bg-white"}`}
            >
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 ${dropoff ? "bg-red-500" : "border-2 border-red-500"} rounded-full`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${dropoff ? "text-gray-900 font-medium" : "text-gray-500"} line-clamp-1`}>
                  {dropoff ? dropoff.address.split(',')[0] : "Select drop location"}
                </p>
                {dropoff && <p className="text-xs text-gray-500 line-clamp-1">{dropoff.address}</p>}
              </div>
              {step === "dropoff" && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => setShowSearch(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Search className="w-4 h-4" />
              Search location
            </button>
          </div>
        </div>
      )}

      {/* Map */}
      {!showSearch && (
        <div className="flex-1 relative">
          <MapContainer
            key={mapKey}
            center={[currentCenter.lat, currentCenter.lng]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {step === "dropoff" && pickup && (
              <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />
            )}
            <MapCenterTracker onCenterChange={(lat, lng) => setCurrentCenter({ lat, lng })} />
          </MapContainer>

          {/* Center marker */}
          <CenterMarker color={step === "pickup" ? "#22c55e" : "#ef4444"} />

          {/* Current location button */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={isGettingLocation}
            className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center z-[1000] border border-gray-200 disabled:opacity-50"
          >
            {isGettingLocation ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Navigation className="w-5 h-5 text-blue-600" />
            )}
          </button>
        </div>
      )}

      {/* Bottom panel */}
      {!showSearch && (
        <div className="bg-white border-t border-gray-200 p-4 space-y-3">
          {/* Selected address */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <div className={`w-5 h-5 ${step === "pickup" ? "bg-green-500" : "bg-red-500"} rounded-full flex items-center justify-center flex-shrink-0`}>
              <MapPin className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {isLoadingAddress ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-500">Finding address...</span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {currentAddress.split(',')[0]}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2">{currentAddress}</p>
                </>
              )}
            </div>
          </div>

          {/* Confirm button */}
          <button
            onClick={step === "pickup" ? handleConfirmPickup : handleConfirmDropoff}
            disabled={isLoadingAddress}
            className="w-full py-4 bg-amber-400 hover:bg-amber-500 disabled:bg-amber-300 text-gray-900 font-bold text-lg rounded-xl transition-colors shadow-md"
          >
            {step === "pickup" ? "Confirm & Select Drop" : "Confirm Drop Location"}
          </button>
        </div>
      )}
    </div>
  );
}
