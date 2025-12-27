import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Currency = "USD" | "NGN";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: number) => string;
  convertAmount: (amount: number) => number;
}

const EXCHANGE_RATE = 1550; // 1 USD = 1550 NGN (approximate)

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem("epic-currency");
    return (saved as Currency) || "USD";
  });

  useEffect(() => {
    localStorage.setItem("epic-currency", currency);
  }, [currency]);

  const convertAmount = (amount: number): number => {
    if (currency === "NGN") {
      return amount * EXCHANGE_RATE;
    }
    return amount;
  };

  const formatAmount = (amount: number): string => {
    const converted = convertAmount(amount);
    if (currency === "NGN") {
      return `₦${converted.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `$${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, convertAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
