import React from 'react';
import { useCurrency } from '../hooks/useCurrency';
import { Button } from './ui/button';

const CurrencySelector = ({ className = '' }) => {
  const { currentCurrency, toggleCurrency, loading } = useCurrency();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-muted-foreground">Currency:</span>
      <Button
        variant="outline"
        size="sm"
        onClick={toggleCurrency}
        disabled={loading}
        className="min-w-[60px] font-medium"
      >
        {currentCurrency === 'NGN' ? '₦ NGN' : '$ USD'}
      </Button>
    </div>
  );
};

export default CurrencySelector;

