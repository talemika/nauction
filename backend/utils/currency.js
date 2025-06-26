const axios = require('axios');

// Default exchange rate (fallback if API fails)
const DEFAULT_USD_TO_NGN_RATE = 800; // 1 USD = 800 NGN (approximate)

class CurrencyConverter {
  constructor() {
    this.exchangeRates = {
      USD_TO_NGN: DEFAULT_USD_TO_NGN_RATE,
      NGN_TO_USD: 1 / DEFAULT_USD_TO_NGN_RATE
    };
    this.lastUpdated = null;
    this.updateInterval = 60 * 60 * 1000; // Update every hour
  }

  // Get exchange rates from external API
  async updateExchangeRates() {
    try {
      // Using exchangerate-api.com (free tier)
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
        timeout: 5000
      });

      if (response.data && response.data.rates && response.data.rates.NGN) {
        this.exchangeRates.USD_TO_NGN = response.data.rates.NGN;
        this.exchangeRates.NGN_TO_USD = 1 / response.data.rates.NGN;
        this.lastUpdated = new Date();
        
        console.log(`Exchange rates updated: 1 USD = ${this.exchangeRates.USD_TO_NGN} NGN`);
        return true;
      }
    } catch (error) {
      console.warn('Failed to update exchange rates from API:', error.message);
      
      // Try alternative API
      try {
        const altResponse = await axios.get('https://api.fixer.io/latest?base=USD&symbols=NGN', {
          timeout: 5000
        });
        
        if (altResponse.data && altResponse.data.rates && altResponse.data.rates.NGN) {
          this.exchangeRates.USD_TO_NGN = altResponse.data.rates.NGN;
          this.exchangeRates.NGN_TO_USD = 1 / altResponse.data.rates.NGN;
          this.lastUpdated = new Date();
          
          console.log(`Exchange rates updated (alt API): 1 USD = ${this.exchangeRates.USD_TO_NGN} NGN`);
          return true;
        }
      } catch (altError) {
        console.warn('Alternative exchange rate API also failed:', altError.message);
      }
    }
    
    console.log(`Using default exchange rates: 1 USD = ${this.exchangeRates.USD_TO_NGN} NGN`);
    return false;
  }

  // Check if rates need updating
  shouldUpdateRates() {
    if (!this.lastUpdated) return true;
    return (Date.now() - this.lastUpdated.getTime()) > this.updateInterval;
  }

  // Convert NGN to USD
  async ngnToUsd(ngnAmount) {
    if (this.shouldUpdateRates()) {
      await this.updateExchangeRates();
    }

    const usdAmount = ngnAmount * this.exchangeRates.NGN_TO_USD;
    return {
      originalAmount: ngnAmount,
      originalCurrency: 'NGN',
      convertedAmount: Math.round(usdAmount * 100) / 100, // Round to 2 decimal places
      convertedCurrency: 'USD',
      exchangeRate: this.exchangeRates.NGN_TO_USD,
      lastUpdated: this.lastUpdated
    };
  }

  // Convert USD to NGN
  async usdToNgn(usdAmount) {
    if (this.shouldUpdateRates()) {
      await this.updateExchangeRates();
    }

    const ngnAmount = usdAmount * this.exchangeRates.USD_TO_NGN;
    return {
      originalAmount: usdAmount,
      originalCurrency: 'USD',
      convertedAmount: Math.round(ngnAmount * 100) / 100, // Round to 2 decimal places
      convertedCurrency: 'NGN',
      exchangeRate: this.exchangeRates.USD_TO_NGN,
      lastUpdated: this.lastUpdated
    };
  }

  // Get current exchange rates
  async getCurrentRates() {
    if (this.shouldUpdateRates()) {
      await this.updateExchangeRates();
    }

    return {
      USD_TO_NGN: this.exchangeRates.USD_TO_NGN,
      NGN_TO_USD: this.exchangeRates.NGN_TO_USD,
      lastUpdated: this.lastUpdated,
      isDefault: !this.lastUpdated
    };
  }

  // Format currency for display
  formatCurrency(amount, currency = 'NGN') {
    const options = {
      style: 'currency',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    };

    switch (currency.toUpperCase()) {
      case 'NGN':
        return new Intl.NumberFormat('en-NG', {
          ...options,
          currency: 'NGN'
        }).format(amount);
      
      case 'USD':
        return new Intl.NumberFormat('en-US', {
          ...options,
          currency: 'USD'
        }).format(amount);
      
      default:
        return `${currency} ${amount.toLocaleString()}`;
    }
  }

  // Convert and format for display
  async convertAndFormat(amount, fromCurrency, toCurrency) {
    let conversion;
    
    if (fromCurrency.toUpperCase() === 'NGN' && toCurrency.toUpperCase() === 'USD') {
      conversion = await this.ngnToUsd(amount);
    } else if (fromCurrency.toUpperCase() === 'USD' && toCurrency.toUpperCase() === 'NGN') {
      conversion = await this.usdToNgn(amount);
    } else {
      throw new Error(`Conversion from ${fromCurrency} to ${toCurrency} is not supported`);
    }

    return {
      ...conversion,
      originalFormatted: this.formatCurrency(conversion.originalAmount, conversion.originalCurrency),
      convertedFormatted: this.formatCurrency(conversion.convertedAmount, conversion.convertedCurrency)
    };
  }

  // Get dual currency display (NGN and USD)
  async getDualCurrencyDisplay(ngnAmount) {
    const usdConversion = await this.ngnToUsd(ngnAmount);
    
    return {
      ngn: {
        amount: ngnAmount,
        formatted: this.formatCurrency(ngnAmount, 'NGN')
      },
      usd: {
        amount: usdConversion.convertedAmount,
        formatted: this.formatCurrency(usdConversion.convertedAmount, 'USD')
      },
      exchangeRate: usdConversion.exchangeRate,
      lastUpdated: usdConversion.lastUpdated
    };
  }
}

// Create singleton instance
const currencyConverter = new CurrencyConverter();

// Initialize exchange rates on startup
currencyConverter.updateExchangeRates().catch(error => {
  console.warn('Initial exchange rate update failed:', error.message);
});

module.exports = currencyConverter;

