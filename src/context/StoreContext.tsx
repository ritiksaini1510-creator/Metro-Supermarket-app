import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  SaleBill,
  PurchaseOrder,
  Supplier,
  StockAdjustment,
  StoreSettings,
  CashDrawerShift,
  ParkedCart,
  PaymentDetails,
  Customer
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_SALES_HISTORY,
  INITIAL_PURCHASES,
  INITIAL_SETTINGS,
  INITIAL_SHIFT
} from '../data/initialData';
import { playScannerBeep, playCashRegisterChime, playWarningBeep, isProductLowStock, isProductExpired, isProductNearExpiry, isProductOutOfStock } from '../utils/helpers';

interface StoreContextType {
  products: Product[];
  suppliers: Supplier[];
  sales: SaleBill[];
  purchases: PurchaseOrder[];
  stockAdjustments: StockAdjustment[];
  cart: CartItem[];
  parkedCarts: ParkedCart[];
  currentShift: CashDrawerShift;
  settings: StoreSettings;
  
  // Real-time alerts count & list
  alerts: {
    outOfStockCount: number;
    lowStockCount: number;
    expiredCount: number;
    nearExpiryCount: number;
    totalAlertsCount: number;
    outOfStockProducts: Product[];
    lowStockProducts: Product[];
    expiredProducts: Product[];
    nearExpiryProducts: Product[];
  };

  // Cart operations
  addToCart: (product: Product, quantity?: number, discountPercent?: number) => boolean;
  updateCartQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discountPercent: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotals: {
    itemCount: number;
    totalQuantity: number;
    subtotal: number;
    taxTotal: number;
    discountTotal: number;
    grandTotal: number;
  };

  // Park / Resume Cart
  parkCurrentCart: (name?: string, customer?: { name: string; phone: string }, notes?: string) => string | null;
  restoreParkedCart: (id: string) => void;
  deleteParkedCart: (id: string) => void;

  // Checkout
  completeSale: (
    payment: PaymentDetails,
    customer?: { name?: string; phone?: string; id?: string },
    globalDiscountPercent?: number,
    notes?: string
  ) => SaleBill | null;

  // Product Inventory CRUD & Adjustments
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (adjustment: Omit<StockAdjustment, 'id' | 'date'>) => void;
  findProductByBarcodeOrSku: (query: string) => Product | undefined;

  // Purchases & Suppliers
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'invoiceNumber'>) => PurchaseOrder;
  recordPurchasePayment: (purchaseId: string, amount: number) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalPurchased' | 'totalPaid' | 'balanceDue'>) => Supplier;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  recordSupplierPayment: (supplierId: string, amount: number, note?: string) => void;

  // Shifts
  closeCurrentShift: (actualCount: number, notes?: string) => void;
  startNewShift: (openingFloat: number, cashierName?: string) => void;

  // Settings & System Data
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  resetToSampleData: () => void;
  exportBackupJSON: () => string;
  importBackupJSON: (jsonString: string) => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'mf_pos_products_v1',
  SUPPLIERS: 'mf_pos_suppliers_v1',
  SALES: 'mf_pos_sales_v1',
  PURCHASES: 'mf_pos_purchases_v1',
  ADJUSTMENTS: 'mf_pos_adjustments_v1',
  PARKED_CARTS: 'mf_pos_parked_carts_v1',
  SHIFT: 'mf_pos_shift_v1',
  SETTINGS: 'mf_pos_settings_v1',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage with fallback to initial sample data
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [sales, setSales] = useState<SaleBill[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    return saved ? JSON.parse(saved) : INITIAL_SALES_HISTORY;
  });

  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
  });

  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [parkedCarts, setParkedCarts] = useState<ParkedCart[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PARKED_CARTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentShift, setCurrentShift] = useState<CashDrawerShift>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHIFT);
    return saved ? JSON.parse(saved) : INITIAL_SHIFT;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  // POS Active Cart (in-memory for active checkout session)
  const [cart, setCart] = useState<CartItem[]>([]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(stockAdjustments));
  }, [stockAdjustments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PARKED_CARTS, JSON.stringify(parkedCarts));
  }, [parkedCarts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIFT, JSON.stringify(currentShift));
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Compute Alerts
  const outOfStockProducts = products.filter(p => isProductOutOfStock(p));
  const lowStockProducts = products.filter(p => isProductLowStock(p, settings.lowStockGlobalThreshold));
  const expiredProducts = products.filter(p => isProductExpired(p));
  const nearExpiryProducts = products.filter(p => isProductNearExpiry(p, settings.expiryWarningDays));

  const alerts = {
    outOfStockCount: outOfStockProducts.length,
    lowStockCount: lowStockProducts.length,
    expiredCount: expiredProducts.length,
    nearExpiryCount: nearExpiryProducts.length,
    totalAlertsCount: outOfStockProducts.length + lowStockProducts.length + expiredProducts.length + nearExpiryProducts.length,
    outOfStockProducts,
    lowStockProducts,
    expiredProducts,
    nearExpiryProducts,
  };

  // Helper to find product by barcode or SKU (case-insensitive)
  const findProductByBarcodeOrSku = (query: string): Product | undefined => {
    if (!query) return undefined;
    const clean = query.trim().toLowerCase();
    return products.find(
      p => p.barcode.toLowerCase() === clean ||
           p.sku.toLowerCase() === clean ||
           p.name.toLowerCase() === clean
    );
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1, discountPercent = 0): boolean => {
    if (product.stock <= 0) {
      playWarningBeep();
      return false;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const item = prev[existingIndex];
        const newQty = item.quantity + quantity;
        
        // Calculate item metrics
        const subtotal = Number((item.unitPrice * newQty * (1 - item.discountPercent / 100)).toFixed(2));
        const taxAmount = Number(((subtotal * item.taxRate) / 100).toFixed(2));
        const total = Number((subtotal + taxAmount).toFixed(2));

        const updated = [...prev];
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          subtotal,
          taxAmount,
          total,
        };
        return updated;
      } else {
        const unitPrice = product.sellingPrice;
        const subtotal = Number((unitPrice * quantity * (1 - discountPercent / 100)).toFixed(2));
        const taxAmount = Number(((subtotal * product.taxRate) / 100).toFixed(2));
        const total = Number((subtotal + taxAmount).toFixed(2));

        return [
          ...prev,
          {
            product,
            quantity,
            unitPrice,
            discountPercent,
            taxRate: product.taxRate,
            subtotal,
            taxAmount,
            total,
          }
        ];
      }
    });

    playScannerBeep();
    return true;
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const subtotal = Number((item.unitPrice * quantity * (1 - item.discountPercent / 100)).toFixed(2));
          const taxAmount = Number(((subtotal * item.taxRate) / 100).toFixed(2));
          const total = Number((subtotal + taxAmount).toFixed(2));
          return {
            ...item,
            quantity,
            subtotal,
            taxAmount,
            total,
          };
        }
        return item;
      })
    );
  };

  const updateItemDiscount = (productId: string, discountPercent: number) => {
    const safeDiscount = Math.max(0, Math.min(100, discountPercent));
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const subtotal = Number((item.unitPrice * item.quantity * (1 - safeDiscount / 100)).toFixed(2));
          const taxAmount = Number(((subtotal * item.taxRate) / 100).toFixed(2));
          const total = Number((subtotal + taxAmount).toFixed(2));
          return {
            ...item,
            discountPercent: safeDiscount,
            subtotal,
            taxAmount,
            total,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Cart Totals Calculation
  const cartTotals = React.useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;
    let totalQuantity = 0;

    cart.forEach(item => {
      totalQuantity += item.quantity;
      const rawItemPrice = item.unitPrice * item.quantity;
      const itemDiscountVal = rawItemPrice * (item.discountPercent / 100);
      discountTotal += itemDiscountVal;
      subtotal += item.subtotal;
      taxTotal += item.taxAmount;
    });

    const grandTotal = Number((subtotal + taxTotal).toFixed(2));

    return {
      itemCount: cart.length,
      totalQuantity: Number(totalQuantity.toFixed(2)),
      subtotal: Number(subtotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      grandTotal,
    };
  }, [cart]);

  // Park Cart
  const parkCurrentCart = (name?: string, customer?: { name: string; phone: string }, notes?: string): string | null => {
    if (cart.length === 0) return null;

    const parkedId = `park-${Date.now()}`;
    const newParked: ParkedCart = {
      id: parkedId,
      name: name || `Cart #${parkedCarts.length + 1} (${customer?.name || 'Walk-in'})`,
      items: [...cart],
      customer,
      parkedAt: new Date().toISOString(),
      notes,
    };

    setParkedCarts(prev => [newParked, ...prev]);
    setCart([]);
    return parkedId;
  };

  const restoreParkedCart = (id: string) => {
    const parked = parkedCarts.find(p => p.id === id);
    if (parked) {
      setCart(parked.items);
      setParkedCarts(prev => prev.filter(p => p.id !== id));
      playScannerBeep();
    }
  };

  const deleteParkedCart = (id: string) => {
    setParkedCarts(prev => prev.filter(p => p.id !== id));
  };

  // Complete Sale (Checkout)
  const completeSale = (
    payment: PaymentDetails,
    customer?: { name?: string; phone?: string; id?: string },
    globalDiscountPercent = 0,
    notes?: string
  ): SaleBill | null => {
    if (cart.length === 0) return null;

    // Apply global discount if provided
    let finalSubtotal = cartTotals.subtotal;
    let finalDiscountTotal = cartTotals.discountTotal;
    let finalTaxTotal = cartTotals.taxTotal;

    if (globalDiscountPercent > 0) {
      const extraDiscount = Number((finalSubtotal * (globalDiscountPercent / 100)).toFixed(2));
      finalDiscountTotal += extraDiscount;
      finalSubtotal = Math.max(0, finalSubtotal - extraDiscount);
      // Recalculate tax on discounted subtotal proportion
      finalTaxTotal = Number((finalSubtotal * (settings.defaultTaxRate / 100)).toFixed(2));
    }

    const finalGrandTotal = Number((finalSubtotal + finalTaxTotal).toFixed(2));
    const invoiceNumber = `INV-${new Date().getFullYear()}-${1000 + sales.length + 1}`;

    const newBill: SaleBill = {
      id: `bill-${Date.now()}`,
      invoiceNumber,
      createdAt: new Date().toISOString(),
      items: [...cart],
      subtotal: finalSubtotal,
      taxTotal: finalTaxTotal,
      discountTotal: finalDiscountTotal,
      grandTotal: finalGrandTotal,
      payment,
      cashierName: settings.cashierName,
      customerId: customer?.id,
      customerName: customer?.name || 'Walk-in Customer',
      customerPhone: customer?.phone,
      notes,
      status: 'completed',
    };

    // 1. Deduct Inventory Stock
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const cartItem = cart.find(ci => ci.product.id === prod.id);
        if (cartItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - cartItem.quantity),
          };
        }
        return prod;
      })
    );

    // 2. Append Sale Bill
    setSales(prev => [newBill, ...prev]);

    // 3. Update Shift Cash / Online Totals
    setCurrentShift(prev => {
      const isCash = payment.method === 'cash' || (payment.method === 'split' && (payment.splitCash || 0) > 0);
      const isOnline = payment.method !== 'cash';

      const cashPortion = payment.method === 'cash' 
        ? finalGrandTotal 
        : (payment.method === 'split' ? (payment.splitCash || 0) : 0);

      const onlinePortion = payment.method !== 'cash' 
        ? (payment.method === 'split' ? (payment.splitOnline || 0) : finalGrandTotal)
        : 0;

      const newCashSales = Number((prev.cashSales + cashPortion).toFixed(2));
      const newOnlineSales = Number((prev.onlineSales + onlinePortion).toFixed(2));
      const newTotalSales = Number((prev.totalSales + finalGrandTotal).toFixed(2));
      const newExpectedCash = Number((prev.openingFloat + newCashSales - prev.cashDrops).toFixed(2));

      return {
        ...prev,
        cashSales: newCashSales,
        onlineSales: newOnlineSales,
        totalSales: newTotalSales,
        expectedCash: newExpectedCash,
      };
    });

    // 4. Clear cart & play audio chime
    setCart([]);
    playCashRegisterChime();

    return newBill;
  };

  // Product CRUD
  const addProduct = (productData: Omit<Product, 'id'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      isActive: true,
      lastRestocked: new Date().toISOString().split('T')[0],
    };

    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, ...productData } : p))
    );
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const adjustStock = (adjustment: Omit<StockAdjustment, 'id' | 'date'>) => {
    const newAdj: StockAdjustment = {
      ...adjustment,
      id: `adj-${Date.now()}`,
      date: new Date().toISOString(),
    };

    setStockAdjustments(prev => [newAdj, ...prev]);

    // Apply to product
    setProducts(prev =>
      prev.map(p => {
        if (p.id === adjustment.productId) {
          return {
            ...p,
            stock: Math.max(0, adjustment.newStock),
          };
        }
        return p;
      })
    );
  };

  // Purchases
  const addPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'invoiceNumber'>): PurchaseOrder => {
    const invoiceNumber = `PO-${new Date().getFullYear()}-${8800 + purchases.length + 1}`;
    const newPO: PurchaseOrder = {
      ...poData,
      id: `po-${Date.now()}`,
      invoiceNumber,
    };

    // 1. Add PO
    setPurchases(prev => [newPO, ...prev]);

    // 2. Increment stock for all items received
    if (poData.status === 'received') {
      setProducts(prev =>
        prev.map(prod => {
          const item = poData.items.find(pi => pi.productId === prod.id);
          if (item) {
            return {
              ...prod,
              stock: prod.stock + item.quantity,
              costPrice: item.costPrice > 0 ? item.costPrice : prod.costPrice,
              lastRestocked: new Date().toISOString().split('T')[0],
              batchNo: item.batchNo || prod.batchNo,
              expiryDate: item.expiryDate || prod.expiryDate,
            };
          }
          return prod;
        })
      );
    }

    // 3. Update Supplier Ledger
    setSuppliers(prev =>
      prev.map(sup => {
        if (sup.id === poData.supplierId) {
          const newPurchased = sup.totalPurchased + poData.grandTotal;
          const newPaid = sup.totalPaid + poData.amountPaid;
          const newBalance = newPurchased - newPaid;
          return {
            ...sup,
            totalPurchased: newPurchased,
            totalPaid: newPaid,
            balanceDue: newBalance,
          };
        }
        return sup;
      })
    );

    return newPO;
  };

  const recordPurchasePayment = (purchaseId: string, amount: number) => {
    setPurchases(prev =>
      prev.map(po => {
        if (po.id === purchaseId) {
          const newAmountPaid = po.amountPaid + amount;
          const newBalance = Math.max(0, po.grandTotal - newAmountPaid);
          const paymentStatus = newBalance === 0 ? 'paid' : (newAmountPaid > 0 ? 'partial' : 'unpaid');
          return {
            ...po,
            amountPaid: newAmountPaid,
            balanceDue: newBalance,
            paymentStatus,
          };
        }
        return po;
      })
    );
  };

  // Suppliers
  const addSupplier = (supData: Omit<Supplier, 'id' | 'totalPurchased' | 'totalPaid' | 'balanceDue'>): Supplier => {
    const newSup: Supplier = {
      ...supData,
      id: `sup-${Date.now()}`,
      totalPurchased: 0,
      totalPaid: 0,
      balanceDue: 0,
      rating: 4.8,
    };
    setSuppliers(prev => [...prev, newSup]);
    return newSup;
  };

  const updateSupplier = (id: string, supData: Partial<Supplier>) => {
    setSuppliers(prev =>
      prev.map(s => (s.id === id ? { ...s, ...supData } : s))
    );
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const recordSupplierPayment = (supplierId: string, amount: number) => {
    setSuppliers(prev =>
      prev.map(s => {
        if (s.id === supplierId) {
          const newPaid = s.totalPaid + amount;
          const newBalance = Math.max(0, s.totalPurchased - newPaid);
          return {
            ...s,
            totalPaid: newPaid,
            balanceDue: newBalance,
          };
        }
        return s;
      })
    );
  };

  // Shifts
  const closeCurrentShift = (actualCount: number, notes?: string) => {
    const discrepancy = Number((actualCount - currentShift.expectedCash).toFixed(2));
    setCurrentShift(prev => ({
      ...prev,
      closedAt: new Date().toISOString(),
      actualCount,
      discrepancy,
      status: 'closed',
      notes: notes || prev.notes,
    }));
  };

  const startNewShift = (openingFloat: number, cashierName?: string) => {
    const newShift: CashDrawerShift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      cashierName: cashierName || settings.cashierName,
      openingFloat,
      cashSales: 0,
      onlineSales: 0,
      totalSales: 0,
      cashDrops: 0,
      expectedCash: openingFloat,
      status: 'open',
      notes: 'Fresh shift initiated.',
    };
    setCurrentShift(newShift);
  };

  // Settings
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetToSampleData = () => {
    setProducts(INITIAL_PRODUCTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setSales(INITIAL_SALES_HISTORY);
    setPurchases(INITIAL_PURCHASES);
    setStockAdjustments([]);
    setParkedCarts([]);
    setCurrentShift(INITIAL_SHIFT);
    setSettings(INITIAL_SETTINGS);
    setCart([]);
  };

  const exportBackupJSON = (): string => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      products,
      suppliers,
      sales,
      purchases,
      stockAdjustments,
      currentShift,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importBackupJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.products && Array.isArray(data.products)) setProducts(data.products);
      if (data.suppliers && Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
      if (data.sales && Array.isArray(data.sales)) setSales(data.sales);
      if (data.purchases && Array.isArray(data.purchases)) setPurchases(data.purchases);
      if (data.settings) setSettings(data.settings);
      if (data.stockAdjustments) setStockAdjustments(data.stockAdjustments);
      return true;
    } catch (e) {
      console.error('Failed to import backup JSON', e);
      return false;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        suppliers,
        sales,
        purchases,
        stockAdjustments,
        cart,
        parkedCarts,
        currentShift,
        settings,
        alerts,
        addToCart,
        updateCartQuantity,
        updateItemDiscount,
        removeFromCart,
        clearCart,
        cartTotals,
        parkCurrentCart,
        restoreParkedCart,
        deleteParkedCart,
        completeSale,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        findProductByBarcodeOrSku,
        addPurchaseOrder,
        recordPurchasePayment,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        recordSupplierPayment,
        closeCurrentShift,
        startNewShift,
        updateSettings,
        resetToSampleData,
        exportBackupJSON,
        importBackupJSON,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
