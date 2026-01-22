// Currency utilities for displaying prices in user's local currency

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

// Map countries to their currencies
export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyInfo> = {
  // North America
  "United States": { code: "USD", symbol: "$", name: "US Dollar" },
  "Canada": { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  "Mexico": { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  
  // Europe
  "United Kingdom": { code: "GBP", symbol: "£", name: "British Pound" },
  "Germany": { code: "EUR", symbol: "€", name: "Euro" },
  "France": { code: "EUR", symbol: "€", name: "Euro" },
  "Italy": { code: "EUR", symbol: "€", name: "Euro" },
  "Spain": { code: "EUR", symbol: "€", name: "Euro" },
  "Netherlands": { code: "EUR", symbol: "€", name: "Euro" },
  "Belgium": { code: "EUR", symbol: "€", name: "Euro" },
  "Austria": { code: "EUR", symbol: "€", name: "Euro" },
  "Portugal": { code: "EUR", symbol: "€", name: "Euro" },
  "Ireland": { code: "EUR", symbol: "€", name: "Euro" },
  "Switzerland": { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  "Norway": { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  "Sweden": { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  "Denmark": { code: "DKK", symbol: "kr", name: "Danish Krone" },
  
  // Asia
  "India": { code: "INR", symbol: "₹", name: "Indian Rupee" },
  "China": { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  "Japan": { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  "South Korea": { code: "KRW", symbol: "₩", name: "South Korean Won" },
  "Singapore": { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  "Hong Kong": { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  "Malaysia": { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  "Thailand": { code: "THB", symbol: "฿", name: "Thai Baht" },
  "Indonesia": { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  "Philippines": { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  "Vietnam": { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  
  // Middle East
  "United Arab Emirates": { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  "Saudi Arabia": { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  "Israel": { code: "ILS", symbol: "₪", name: "Israeli Shekel" },
  "Turkey": { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  
  // Oceania
  "Australia": { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  "New Zealand": { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  
  // South America
  "Brazil": { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  "Argentina": { code: "ARS", symbol: "AR$", name: "Argentine Peso" },
  "Chile": { code: "CLP", symbol: "CL$", name: "Chilean Peso" },
  "Colombia": { code: "COP", symbol: "CO$", name: "Colombian Peso" },
  
  // Africa
  "South Africa": { code: "ZAR", symbol: "R", name: "South African Rand" },
  "Nigeria": { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  "Egypt": { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
  "Kenya": { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
};

// Approximate exchange rates to USD (update periodically)
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.0,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 149.0,
  CNY: 7.24,
  CHF: 0.88,
  SGD: 1.34,
  HKD: 7.81,
  NZD: 1.64,
  KRW: 1310.0,
  MXN: 17.0,
  BRL: 4.95,
  ZAR: 18.5,
  AED: 3.67,
  SAR: 3.75,
  NOK: 10.9,
  SEK: 10.8,
  DKK: 6.87,
  THB: 35.5,
  MYR: 4.48,
  IDR: 15700.0,
  PHP: 56.0,
  VND: 24500.0,
  ILS: 3.65,
  TRY: 32.5,
  ARS: 1000.0,
  CLP: 975.0,
  COP: 4100.0,
  NGN: 1550.0,
  EGP: 48.9,
  KES: 129.0,
};

/**
 * Get currency information for a country
 */
export function getCurrencyForCountry(country: string | null | undefined): CurrencyInfo {
  if (!country) {
    return { code: "USD", symbol: "$", name: "US Dollar" };
  }
  
  return COUNTRY_CURRENCY_MAP[country] || { code: "USD", symbol: "$", name: "US Dollar" };
}

/**
 * Convert price from one currency to another
 */
export function convertPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  const fromRate = EXCHANGE_RATES[fromCurrency] || 1.0;
  const toRate = EXCHANGE_RATES[toCurrency] || 1.0;
  
  // Convert to USD first, then to target currency
  const amountInUSD = amount / fromRate;
  const convertedAmount = amountInUSD * toRate;
  
  return Math.round(convertedAmount * 100) / 100;
}

/**
 * Format price with currency symbol and appropriate decimal places
 */
export function formatPrice(
  amount: number,
  currencyCode: string,
  showDecimals: boolean = true
): string {
  const currencyInfo = Object.values(COUNTRY_CURRENCY_MAP).find(
    c => c.code === currencyCode
  ) || { code: currencyCode, symbol: currencyCode, name: currencyCode };
  
  // Currencies that typically don't use decimals
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR', 'CLP'];
  const useDecimals = showDecimals && !noDecimalCurrencies.includes(currencyCode);
  
  const formattedAmount = useDecimals 
    ? amount.toFixed(2)
    : Math.round(amount).toString();
  
  // Add thousands separator
  const parts = formattedAmount.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${currencyInfo.symbol}${parts.join('.')}`;
}

/**
 * Get converted price with formatted display
 */
export function getLocalizedPrice(
  baseAmount: number,
  baseCurrency: string,
  userCountry: string | null | undefined
): { amount: number; formatted: string; currency: CurrencyInfo } {
  const currency = getCurrencyForCountry(userCountry);
  const convertedAmount = convertPrice(baseAmount, baseCurrency, currency.code);
  const formatted = formatPrice(convertedAmount, currency.code);
  
  return {
    amount: convertedAmount,
    formatted,
    currency,
  };
}
