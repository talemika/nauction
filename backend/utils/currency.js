// Currency conversion utilities
// Exchange rates (in a real application, these would come from an API)
const EXCHANGE_RATES = {
  NGN_TO_USD: 0.0012, // 1 NGN = 0.0012 USD (approximate)
  USD_TO_NGN: 833.33   // 1 USD = 833.33 NGN (approximate)
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - The amount to convert
 * @param {string} fromCurrency - Source currency (NGN or USD)
 * @param {string} toCurrency - Target currency (NGN or USD)
 * @returns {number} - Converted amount
 */
function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  if (fromCurrency === 'NGN' && toCurrency === 'USD') {
    return amount * EXCHANGE_RATES.NGN_TO_USD;
  }
  
  if (fromCurrency === 'USD' && toCurrency === 'NGN') {
    return amount * EXCHANGE_RATES.USD_TO_NGN;
  }
  
  throw new Error(`Unsupported currency conversion: ${fromCurrency} to ${toCurrency}`);
}

/**
 * Format currency amount with appropriate symbol
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (NGN or USD)
 * @returns {string} - Formatted currency string
 */
function formatCurrency(amount, currency) {
  const formattedAmount = amount.toLocaleString('en-US', {
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
}

/**
 * Get current exchange rates
 * @returns {object} - Exchange rates object
 */
function getExchangeRates() {
  return EXCHANGE_RATES;
}

/**
 * Update exchange rates (for future API integration)
 * @param {object} newRates - New exchange rates
 */
function updateExchangeRates(newRates) {
  Object.assign(EXCHANGE_RATES, newRates);
}

module.exports = {
  convertCurrency,
  formatCurrency,
  getExchangeRates,
  updateExchangeRates
};

