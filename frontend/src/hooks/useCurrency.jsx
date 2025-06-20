import React, { createContext, useContext, useState, useEffect } from 'react';
import { currencyAPI } from '../lib/api';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currentCurrency, setCurrentCurrency] = useState('NGN'); // Default to Naira
  const [exchangeRates, setExchangeRates] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch exchange rates on component mount
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      const response = await currencyAPI.getExchangeRates();
      if (response.data.success) {
        setExchangeRates(response.data.rates);
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert amount from one currency to another
  const convertAmount = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    if (fromCurrency === 'NGN' && toCurrency === 'USD') {
      return amount * (exchangeRates.NGN_TO_USD || 0.0012);
    }

    if (fromCurrency === 'USD' && toCurrency === 'NGN') {
      return amount * (exchangeRates.USD_TO_NGN || 833.33);
    }

    return amount;
  };

  // Format currency with appropriate symbol
  const formatCurrency = (amount, currency = currentCurrency) => {
    const formattedAmount = Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    switch (currency) {
      case 'NGN':
        return `₦${formattedAmount}`;
      case 'USD':
        return `$${formattedAmount}`;
      default:
        return `${formattedAmount} ${currency}`;
    }
  };

  // Get currency symbol
  const getCurrencySymbol = (currency = currentCurrency) => {
    switch (currency) {
      case 'NGN':
        return '₦';
      case 'USD':
        return '$';
      default:
        return currency;
    }
  };

  // Toggle between NGN and USD
  const toggleCurrency = () => {
    setCurrentCurrency(prev => prev === 'NGN' ? 'USD' : 'NGN');
  };

  // Set specific currency
  const setCurrency = (currency) => {
    if (['NGN', 'USD'].includes(currency)) {
      setCurrentCurrency(currency);
    }
  };

  // Display amount in current currency (convert if needed)
  const displayAmount = (amount, originalCurrency) => {
    const convertedAmount = convertAmount(amount, originalCurrency, currentCurrency);
    return formatCurrency(convertedAmount, currentCurrency);
  };

  const value = {
    currentCurrency,
    exchangeRates,
    loading,
    convertAmount,
    formatCurrency,
    getCurrencySymbol,
    toggleCurrency,
    setCurrency,
    displayAmount,
    fetchExchangeRates
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;

