const express = require('express');
const { convertCurrency, formatCurrency, getExchangeRates } = require('../utils/currency');
const router = express.Router();

// Get current exchange rates
router.get('/rates', async (req, res) => {
  try {
    const rates = getExchangeRates();
    res.json({
      success: true,
      rates: rates,
      supportedCurrencies: ['NGN', 'USD']
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exchange rates'
    });
  }
});

// Convert currency amount
router.post('/convert', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    
    // Validation
    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Amount, fromCurrency, and toCurrency are required'
      });
    }
    
    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }
    
    if (!['NGN', 'USD'].includes(fromCurrency) || !['NGN', 'USD'].includes(toCurrency)) {
      return res.status(400).json({
        success: false,
        message: 'Supported currencies are NGN and USD'
      });
    }
    
    const convertedAmount = convertCurrency(parseFloat(amount), fromCurrency, toCurrency);
    const formattedAmount = formatCurrency(convertedAmount, toCurrency);
    
    res.json({
      success: true,
      originalAmount: parseFloat(amount),
      originalCurrency: fromCurrency,
      convertedAmount: convertedAmount,
      convertedCurrency: toCurrency,
      formattedAmount: formattedAmount
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to convert currency'
    });
  }
});

// Get formatted currency string
router.post('/format', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    
    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Amount and currency are required'
      });
    }
    
    if (isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a number'
      });
    }
    
    const formattedAmount = formatCurrency(parseFloat(amount), currency);
    
    res.json({
      success: true,
      amount: parseFloat(amount),
      currency: currency,
      formatted: formattedAmount
    });
  } catch (error) {
    console.error('Error formatting currency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to format currency'
    });
  }
});

module.exports = router;

