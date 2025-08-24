import { useState, useEffect } from "react";

interface CookieConsent {
  hasConsented: boolean;
  categories: Record<string, boolean>;
  timestamp: number;
}

const STORAGE_KEY = "futsal-culture-cookie-consent";

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    const storedConsent = getStoredConsent();
    setConsent(storedConsent);
  }, []);

  const getStoredConsent = (): CookieConsent | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const updateConsent = (categories: Record<string, boolean>) => {
    const newConsent: CookieConsent = {
      hasConsented: true,
      categories,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConsent));
      setConsent(newConsent);
      
      // Apply cookie settings
      if (categories.analytics) {
        console.log("Analytics cookies enabled");
      } else {
        console.log("Analytics cookies disabled");
      }
      
      if (categories.functional) {
        console.log("Functional cookies enabled");
      } else {
        console.log("Functional cookies disabled");
      }
      
    } catch (error) {
      console.error("Failed to save cookie consent:", error);
    }
  };

  const resetConsent = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setConsent(null);
    } catch (error) {
      console.error("Failed to reset cookie consent:", error);
    }
  };

  const hasConsented = () => {
    return consent?.hasConsented || false;
  };

  const isCategoryEnabled = (category: string) => {
    return consent?.categories?.[category] || false;
  };

  return {
    consent,
    hasConsented,
    isCategoryEnabled,
    updateConsent,
    resetConsent
  };
}