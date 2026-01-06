import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface CartModifier {
  groupId: number;
  groupName: string;
  optionId: number;
  optionName: string;
  priceAdjustment: number;
}

export interface CartItem {
  id: string; // unique ID for this cart entry
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  modifiers: CartModifier[];
  specialInstructions?: string;
}

interface CartContextType {
  items: CartItem[];
  tableId: number | null;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItem: (id: string, updates: Partial<Omit<CartItem, 'id'>>) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  getItemPrice: (item: CartItem) => number;
  setTableId: (tableId: number | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load cart from localStorage on initialization
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [tableId, setTableId] = useState<number | null>(() => {
    // Load table ID from localStorage on initialization
    const savedTableId = localStorage.getItem('cartTableId');
    return savedTableId ? JSON.parse(savedTableId) : null;
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Save table ID to localStorage whenever it changes
  useEffect(() => {
    if (tableId !== null) {
      localStorage.setItem('cartTableId', JSON.stringify(tableId));
    } else {
      localStorage.removeItem('cartTableId');
    }
  }, [tableId]);

  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const getItemPrice = (item: CartItem): number => {
    const basePrice = item.price;
    const modifiersPrice = item.modifiers.reduce(
      (sum, mod) => sum + mod.priceAdjustment,
      0
    );
    return (basePrice + modifiersPrice) * item.quantity;
  };

  const addItem = (itemData: Omit<CartItem, 'id'>) => {
    const newItem: CartItem = {
      ...itemData,
      id: generateId(),
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const updateItem = (id: string, updates: Partial<Omit<CartItem, 'id'>>) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    setTableId(null);
  };

  const getTotalPrice = (): number => {
    return items.reduce((total, item) => total + getItemPrice(item), 0);
  };

  const getTotalItems = (): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        tableId,
        addItem,
        removeItem,
        updateQuantity,
        updateItem,
        clearCart,
        getTotalPrice,
        getTotalItems,
        getItemPrice,
        setTableId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
