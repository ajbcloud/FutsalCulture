import { useState, useEffect } from "react";
import { FutsalSession } from "@shared/schema";

export function useCart() {
  const [cartItems, setCartItems] = useState<FutsalSession[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('futsal-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('futsal-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (session: FutsalSession) => {
    setCartItems(prev => {
      // Check if session already in cart
      const exists = prev.find(item => item.id === session.id);
      if (exists) {
        return prev; // Don't add duplicates
      }
      return [...prev, session];
    });
  };

  const removeFromCart = (sessionId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== sessionId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalPrice = cartItems.reduce((sum, session) => sum + session.priceCents, 0);
  const itemCount = cartItems.length;

  return {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    totalPrice,
    itemCount,
  };
}