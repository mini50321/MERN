import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { MapPin, Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue with Leaflet in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LocationMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
  height?: string;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationMapPicker({ 
  latitude, 
  longitude, 
  onLocationSelect,
  height = "300px" 
}: LocationMapPickerProps) {
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (latitude && longitude) {
      const newPosition: [number, number] = [latitude, longitude];
      setCurrentPosition(newPosition);
      
      // Force map re-render with new center
      setMapKey(prev => prev + 1);
    }
  }, [latitude, longitude]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newPosition: [number, number] = [lat, lng];
        setCurrentPosition(newPosition);
        onLocationSelect(lat, lng);
        setIsGettingLocation(false);

        // Force map re-render to update center
        setMapKey(prev => prev + 1);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to get your location. Please ensure location permissions are enabled.");
        setIsGettingLocation(false);
      }
    );
  };

  const defaultCenter: [number, number] = currentPosition || [20.5937, 78.9629]; // Center of India as default
  const defaultZoom = currentPosition ? 13 : 5;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            {currentPosition ? "Click on map to adjust location" : "Click on map to mark your location"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGettingLocation ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Getting...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              Use My Location
            </>
          )}
        </button>
      </div>

      <div className="border-2 border-gray-300 rounded-lg overflow-hidden" style={{ height }}>
        <MapContainer
          key={mapKey}
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {currentPosition && <Marker position={currentPosition} />}
          <MapClickHandler onLocationSelect={onLocationSelect} />
        </MapContainer>
      </div>

      {currentPosition && (
        <div className="text-xs text-gray-600 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>
            Coordinates: {currentPosition[0].toFixed(6)}, {currentPosition[1].toFixed(6)}
          </span>
        </div>
      )}
    </div>
  );
}
