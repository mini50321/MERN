/**
 * Pricing utilities for service quotes
 * Implements city-tier based pricing adjustments for Andhra Pradesh
 */

// Andhra Pradesh city tier definitions
const TIER_1_CITIES = [
  'vizag', 'visakhapatnam', 'vijayawada', 'guntur'
];

const TIER_2_CITIES = [
  'kakinada', 'rajahmundry', 'tirupati', 'nellore', 'kurnool',
  'kadapa', 'anantapur', 'eluru', 'ongole', 'bhimavaram',
  'machilipatnam', 'tenali', 'proddatur', 'hindupur', 'chittoor'
];

// Premium localities (applied within cities for premium areas)
const PREMIUM_LOCALITIES = [
  'benz circle', 'mvp colony', 'jubilee hills', 'film nagar',
  'madhurawada', 'gachibowli', 'hitech city'
];

/**
 * Determine city tier based on city name
 */
export function getCityTier(city: string | null, address: string | null): 'tier-1' | 'tier-2' | 'tier-3' | 'premium' {
  if (!city) return 'tier-3';
  
  const cityLower = city.toLowerCase().trim();
  const addressLower = (address || '').toLowerCase();
  
  // Check for premium localities first
  const isPremiumLocality = PREMIUM_LOCALITIES.some(locality => 
    addressLower.includes(locality) || cityLower.includes(locality)
  );
  
  if (isPremiumLocality) {
    return 'premium';
  }
  
  // Check tier-1 cities
  const isTier1 = TIER_1_CITIES.some(tier1City => 
    cityLower.includes(tier1City) || tier1City.includes(cityLower)
  );
  
  if (isTier1) {
    return 'tier-1';
  }
  
  // Check tier-2 cities
  const isTier2 = TIER_2_CITIES.some(tier2City => 
    cityLower.includes(tier2City) || tier2City.includes(cityLower)
  );
  
  if (isTier2) {
    return 'tier-2';
  }
  
  // Default to tier-3
  return 'tier-3';
}

/**
 * Get price multiplier based on city tier
 */
export function getCityPriceMultiplier(tier: 'tier-1' | 'tier-2' | 'tier-3' | 'premium'): number {
  switch (tier) {
    case 'premium':
      return 1.30; // +30%
    case 'tier-1':
      return 1.20; // +20%
    case 'tier-2':
      return 1.10; // +10%
    case 'tier-3':
      return 1.00; // Base price (0%)
    default:
      return 1.00;
  }
}

/**
 * Calculate adjusted price based on city tier
 */
export function calculateCityAdjustedPrice(basePrice: number, city: string | null, address: string | null): number {
  const tier = getCityTier(city, address);
  const multiplier = getCityPriceMultiplier(tier);
  return Math.round(basePrice * multiplier);
}

/**
 * Apply add-on charges (night duty, emergency, Sunday/holiday, extended session)
 */
export interface PriceAddOns {
  isNightDuty?: boolean;
  isEmergency?: boolean;
  consumablesCost?: number;
  isSundayHoliday?: boolean;
  isExtendedSession?: boolean;
  nightDutyPercentage?: number;
  emergencyPercentage?: number;
}

export function applyAddOns(basePrice: number, addOns: PriceAddOns): number {
  let finalPrice = basePrice;
  
  // Night duty: use configurable percentage (default +20%)
  if (addOns.isNightDuty) {
    const nightDutyMultiplier = 1 + ((addOns.nightDutyPercentage || 20) / 100);
    finalPrice = finalPrice * nightDutyMultiplier;
  }
  
  // Emergency / same-day visit: use configurable percentage (default +15%)
  if (addOns.isEmergency) {
    const emergencyMultiplier = 1 + ((addOns.emergencyPercentage || 15) / 100);
    finalPrice = finalPrice * emergencyMultiplier;
  }
  
  // Consumables billed separately (not included in service price)
  // This is just for reference
  
  return Math.round(finalPrice);
}

/**
 * Calculate final quoted price with all adjustments
 */
export function calculateFinalQuote(
  basePrice: number,
  city: string | null,
  address: string | null,
  addOns: PriceAddOns = {}
): {
  finalPrice: number;
  cityTier: string;
  cityAdjustment: number;
  addOnsApplied: string[];
  breakdown: {
    basePrice: number;
    afterCityAdjustment: number;
    nightDutyCharge?: number;
    nightDutyPercentage?: number;
    sundayHolidayCharge?: number;
    extendedSessionCharge?: number;
    emergencyCharge?: number;
    emergencyPercentage?: number;
    consumables?: number;
  };
} {
  const tier = getCityTier(city, address);
  const cityMultiplier = getCityPriceMultiplier(tier);
  const afterCityAdjustment = Math.round(basePrice * cityMultiplier);
  
  let currentPrice = afterCityAdjustment;
  const addOnsApplied: string[] = [];
  const breakdown: any = {
    basePrice,
    afterCityAdjustment,
  };
  
  const nightDutyPercentage = addOns.nightDutyPercentage || 20;
  const emergencyPercentage = addOns.emergencyPercentage || 15;
  
  // Apply night duty (nursing only)
  if (addOns.isNightDuty) {
    const nightCharge = Math.round(currentPrice * (nightDutyPercentage / 100));
    breakdown.nightDutyCharge = nightCharge;
    breakdown.nightDutyPercentage = nightDutyPercentage;
    currentPrice += nightCharge;
    addOnsApplied.push(`Night Duty (+${nightDutyPercentage}%)`);
  }
  
  // Apply Sunday/holiday charge (physiotherapy)
  if (addOns.isSundayHoliday) {
    const sundayCharge = Math.round(currentPrice * 0.10);
    breakdown.sundayHolidayCharge = sundayCharge;
    currentPrice += sundayCharge;
    addOnsApplied.push('Sunday/Holiday (+10%)');
  }
  
  // Apply extended session charge (physiotherapy)
  if (addOns.isExtendedSession) {
    const extendedCharge = Math.round(currentPrice * 0.10);
    breakdown.extendedSessionCharge = extendedCharge;
    currentPrice += extendedCharge;
    addOnsApplied.push('Extended Session (+10%)');
  }
  
  // Apply emergency
  if (addOns.isEmergency) {
    const emergencyCharge = Math.round(currentPrice * (emergencyPercentage / 100));
    breakdown.emergencyCharge = emergencyCharge;
    breakdown.emergencyPercentage = emergencyPercentage;
    currentPrice += emergencyCharge;
    addOnsApplied.push(`Emergency/Urgent (+${emergencyPercentage}%)`);
  }
  
  // Note consumables
  if (addOns.consumablesCost && addOns.consumablesCost > 0) {
    breakdown.consumables = addOns.consumablesCost;
    addOnsApplied.push('Consumables (billed separately)');
  }
  
  return {
    finalPrice: currentPrice,
    cityTier: tier,
    cityAdjustment: Math.round((cityMultiplier - 1) * 100), // Percentage
    addOnsApplied,
    breakdown,
  };
}

/**
 * Get human-readable tier description
 */
export function getTierDescription(tier: string): string {
  switch (tier) {
    case 'premium':
      return 'Premium Locality';
    case 'tier-1':
      return 'Tier-1 City (Major AP Cities)';
    case 'tier-2':
      return 'Tier-2 City';
    case 'tier-3':
      return 'Tier-3 Town (Base Rate)';
    default:
      return 'Standard Rate';
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate ambulance fare based on distance
 */
export function calculateAmbulanceFare(
  minimumFare: number,
  minimumKm: number,
  perKmCharge: number,
  distance: number,
  city: string | null,
  address: string | null,
  addOns: PriceAddOns = {}
): {
  finalPrice: number;
  cityTier: string;
  cityAdjustment: number;
  breakdown: {
    baseFare: number;
    minimumKmCovered: number;
    extraKm: number;
    extraKmCharge: number;
    subtotal: number;
    afterCityAdjustment: number;
    nightDutyCharge?: number;
    nightDutyPercentage?: number;
    emergencyCharge?: number;
    emergencyPercentage?: number;
  };
} {
  // Calculate base fare
  const extraKm = Math.max(0, distance - minimumKm);
  const extraKmCharge = Math.round(extraKm * perKmCharge);
  const baseFare = minimumFare + extraKmCharge;
  
  // Apply city tier adjustment
  const tier = getCityTier(city, address);
  const cityMultiplier = getCityPriceMultiplier(tier);
  const afterCityAdjustment = Math.round(baseFare * cityMultiplier);
  
  let currentPrice = afterCityAdjustment;
  const breakdown: any = {
    baseFare: minimumFare,
    minimumKmCovered: minimumKm,
    extraKm,
    extraKmCharge,
    subtotal: baseFare,
    afterCityAdjustment,
  };
  
  const nightDutyPercentage = addOns.nightDutyPercentage || 20;
  const emergencyPercentage = addOns.emergencyPercentage || 15;
  
  // Apply night duty (10 PM - 6 AM): configurable percentage
  if (addOns.isNightDuty) {
    const nightCharge = Math.round(currentPrice * (nightDutyPercentage / 100));
    breakdown.nightDutyCharge = nightCharge;
    breakdown.nightDutyPercentage = nightDutyPercentage;
    currentPrice += nightCharge;
  }
  
  // Apply emergency dispatch (within 30 mins): configurable percentage
  if (addOns.isEmergency) {
    const emergencyCharge = Math.round(currentPrice * (emergencyPercentage / 100));
    breakdown.emergencyCharge = emergencyCharge;
    breakdown.emergencyPercentage = emergencyPercentage;
    currentPrice += emergencyCharge;
  }
  
  return {
    finalPrice: currentPrice,
    cityTier: tier,
    cityAdjustment: Math.round((cityMultiplier - 1) * 100), // Percentage
    breakdown,
  };
}
