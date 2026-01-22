import { useState, useEffect } from 'react';

interface PhysiotherapyServicePrice {
  id: number;
  service_name: string;
  per_session_price: number;
  monthly_price: number | null;
  description: string;
  is_active: boolean;
}

export function usePhysiotherapyPrices() {
  const [prices, setPrices] = useState<PhysiotherapyServicePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/physiotherapy-prices');
      if (!response.ok) throw new Error('Failed to fetch prices');
      const data = await response.json();
      setPrices(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prices');
      console.error('Error fetching physiotherapy prices:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriceForService = (serviceName: string) => {
    const price = prices.find(p => p.service_name === serviceName && p.is_active);
    return price || null;
  };

  return {
    prices,
    loading,
    error,
    getPriceForService,
    refetch: fetchPrices
  };
}
