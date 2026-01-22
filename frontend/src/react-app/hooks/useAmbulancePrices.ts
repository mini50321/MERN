import { useState, useEffect } from 'react';

export interface AmbulancePrice {
  id: number;
  service_name: string;
  minimum_fare: number;
  minimum_km: number;
  per_km_charge: number;
  description: string;
  is_active: boolean;
}

export function useAmbulancePrices() {
  const [prices, setPrices] = useState<AmbulancePrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ambulance-prices');
      if (response.ok) {
        const data = await response.json();
        setPrices(data);
      } else {
        setError('Failed to load ambulance prices');
      }
    } catch (err) {
      setError('Failed to load ambulance prices');
      console.error('Error loading ambulance prices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { prices, isLoading, error, reload: loadPrices };
}
