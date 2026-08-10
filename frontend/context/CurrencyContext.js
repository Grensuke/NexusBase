'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── Currency definitions ────────────────────────────────────────────────────
// All prices in the DB are stored in INR (₹).
// Rates are approximate live-order-of-magnitude values for a demo project.
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'INR (₹)', rate: 1 },
  { code: 'USD', symbol: '$', label: 'USD ($)', rate: 0.012  },
  { code: 'EUR', symbol: '€', label: 'EUR (€)', rate: 0.011  },
  { code: 'GBP', symbol: '£', label: 'GBP (£)', rate: 0.0095 },
  { code: 'AED', symbol: 'د.إ', label: 'AED', rate: 0.044  },
];

const DEFAULT_CODE = 'INR';
const LS_KEY       = 'nexusbase_currency';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currencyCode, setCurrencyCode] = useState(DEFAULT_CODE);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved && CURRENCIES.find(c => c.code === saved)) {
        setCurrencyCode(saved);
      }
    } catch { /* SSR / private browsing */ }
  }, []);

  const setCurrency = useCallback((code) => {
    const found = CURRENCIES.find(c => c.code === code);
    if (!found) return;
    setCurrencyCode(code);
    try { localStorage.setItem(LS_KEY, code); } catch {}
  }, []);

  /** Format an INR amount into the active currency */
  const formatPrice = useCallback((amountInr, opts = {}) => {
    const cur = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
    const converted = parseFloat(amountInr) * cur.rate;
    const decimals  = opts.decimals ?? (cur.code === 'INR' ? 0 : 2);
    return `${cur.symbol}${converted.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }, [currencyCode]);

  /** Convert an INR amount to active currency (raw number) */
  const convert = useCallback((amountInr) => {
    const cur = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
    return parseFloat(amountInr) * cur.rate;
  }, [currencyCode]);

  const activeCurrency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];

  return (
    <CurrencyContext.Provider value={{ currencyCode, setCurrency, formatPrice, convert, activeCurrency, CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside <CurrencyProvider>');
  return ctx;
}
