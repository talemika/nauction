import { createContext, useContext, useState, useEffect } from 'react';
import { currencyAPI } from '../services/api';

// Create context
const CurrencyContext = createContext();

// Provider component
export const CurrencyProvider = ({ children }) => {
  const [exchangeRates, setExchangeRates] = useState({
    USD_TO_NGN: 800,
    NGN_TO_USD: 1 / 800,
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [displayCurrency, setDisplayCurrency] = useState('NGN'); // Default to NGN

  // Fetch exchange rates on mount
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  // Fetch exchange rates from API
  const fetchExchangeRates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await currencyAPI.getRates();
      const { rates } = response.data;

      setExchangeRates({
        USD_TO_NGN: rates.USD_TO_NGN,
        NGN_TO_USD: rates.NGN_TO_USD,
      });
      setLastUpdated(rates.lastUpdated ? new Date(rates.lastUpdated) : null);
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      setError('Failed to fetch exchange rates');
      // Keep using default rates
    } finally {
      setIsLoading(false);
    }
  };

  // Convert NGN to USD
  const ngnToUsd = (ngnAmount) => {
    const usdAmount = ngnAmount * exchangeRates.NGN_TO_USD;
    return Math.round(usdAmount * 100) / 100; // Round to 2 decimal places
  };

  // Convert USD to NGN
  const usdToNgn = (usdAmount) => {
    const ngnAmount = usdAmount * exchangeRates.USD_TO_NGN;
    return Math.round(ngnAmount * 100) / 100; // Round to 2 decimal places
  };

  // Format currency for display
  const formatCurrency = (amount, currency = 'NGN') => {
    const options = {
      style: 'currency',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    };

    try {
      switch (currency.toUpperCase()) {
        case 'NGN':
          return new Intl.NumberFormat('en-NG', {
            ...options,
            currency: 'NGN',
          }).format(amount);
        
        case 'USD':
          return new Intl.NumberFormat('en-US', {
            ...options,
            currency: 'USD',
          }).format(amount);
        
        default:
          return `${currency} ${amount.toLocaleString()}`;
      }
    } catch (error) {
      // Fallback formatting if Intl.NumberFormat fails
      return `${currency === 'NGN' ? '₦' : '$'}${amount.toLocaleString()}`;
    }
  };

  // Get dual currency display (both NGN and USD)
  const getDualCurrencyDisplay = (ngnAmount) => {
    const usdAmount = ngnToUsd(ngnAmount);
    
    return {
      ngn: {
        amount: ngnAmount,
        formatted: formatCurrency(ngnAmount, 'NGN'),
      },
      usd: {
        amount: usdAmount,
        formatted: formatCurrency(usdAmount, 'USD'),
      },
    };
  };

  // Convert and format for display
  const convertAndFormat = (amount, fromCurrency, toCurrency) => {
    let convertedAmount;
    
    if (fromCurrency.toUpperCase() === 'NGN' && toCurrency.toUpperCase() === 'USD') {
      convertedAmount = ngnToUsd(amount);
    } else if (fromCurrency.toUpperCase() === 'USD' && toCurrency.toUpperCase() === 'NGN') {
      convertedAmount = usdToNgn(amount);
    } else {
      convertedAmount = amount; // Same currency
    }

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency.toUpperCase(),
      convertedAmount,
      convertedCurrency: toCurrency.toUpperCase(),
      originalFormatted: formatCurrency(amount, fromCurrency),
      convertedFormatted: formatCurrency(convertedAmount, toCurrency),
      exchangeRate: fromCurrency.toUpperCase() === 'NGN' ? exchangeRates.NGN_TO_USD : exchangeRates.USD_TO_NGN,
    };
  };

  // Toggle display currency
  const toggleDisplayCurrency = () => {
    setDisplayCurrency(prev => prev === 'NGN' ? 'USD' : 'NGN');
  };

  // Format amount based on current display currency
  const formatDisplayAmount = (ngnAmount) => {
    if (displayCurrency === 'USD') {
      const usdAmount = ngnToUsd(ngnAmount);
      return formatCurrency(usdAmount, 'USD');
    }
    return formatCurrency(ngnAmount, 'NGN');
  };

  // Get display amount and currency
  const getDisplayAmount = (ngnAmount) => {
    if (displayCurrency === 'USD') {
      const usdAmount = ngnToUsd(ngnAmount);
      return {
        amount: usdAmount,
        currency: 'USD',
        formatted: formatCurrency(usdAmount, 'USD'),
      };
    }
    return {
      amount: ngnAmount,
      currency: 'NGN',
      formatted: formatCurrency(ngnAmount, 'NGN'),
    };
  };

  // Update exchange rates manually
  const updateExchangeRates = async () => {
    await fetchExchangeRates();
  };

  // Check if rates are stale (older than 1 hour)
  const areRatesStale = () => {
    if (!lastUpdated) return true;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return lastUpdated < oneHourAgo;
  };

  const value = {
    exchangeRates,
    lastUpdated,
    isLoading,
    error,
    displayCurrency,
    ngnToUsd,
    usdToNgn,
    formatCurrency,
    getDualCurrencyDisplay,
    convertAndFormat,
    toggleDisplayCurrency,
    formatDisplayAmount,
    getDisplayAmount,
    updateExchangeRates,
    areRatesStale,
    setDisplayCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook to use currency context
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export default CurrencyContext;

