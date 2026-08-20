import { Product, SaleBill, PurchaseOrder } from '../types';

export const formatCurrency = (amount: number, symbol: string = '₹'): string => {
  return `${symbol}${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export const getDaysUntilExpiry = (expiryDate?: string): number | null => {
  if (!expiryDate) return null;
  const target = new Date(expiryDate);
  const now = new Date();
  // Strip time
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isProductExpired = (product: Product): boolean => {
  const days = getDaysUntilExpiry(product.expiryDate);
  return days !== null && days <= 0;
};

export const isProductNearExpiry = (product: Product, warningDays: number = 30): boolean => {
  const days = getDaysUntilExpiry(product.expiryDate);
  return days !== null && days > 0 && days <= warningDays;
};

export const isProductLowStock = (product: Product, globalThreshold: number = 15): boolean => {
  const threshold = product.minStockThreshold ?? globalThreshold;
  return product.stock > 0 && product.stock <= threshold;
};

export const isProductOutOfStock = (product: Product): boolean => {
  return product.stock <= 0;
};

// Web Audio API Sound generator for cashier feedback without external audio files
export const playScannerBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime); // High pitch supermarket beep
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Ignore audio autoplay restrictions
  }
};

export const playCashRegisterChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    
    // First chime note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.frequency.setValueAtTime(987.77, now); // B5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second chime note
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.frequency.setValueAtTime(1318.51, now + 0.1); // E6
    gain2.gain.setValueAtTime(0.2, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.45);
  } catch {
    // Ignore
  }
};

export const playWarningBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(320, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Ignore
  }
};

// CSV Exporter helper
export const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => 
    headers.map(header => {
      const val = obj[header];
      if (val === null || val === undefined) return '""';
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Generate printable barcode SVG representation (Code 128 / EAN style visual strips)
export const generateBarcodePattern = (code: string): string[] => {
  // Deterministic bar widths based on char codes
  const widths: string[] = [];
  widths.push('w-1 bg-black');
  widths.push('w-0.5 bg-white');
  widths.push('w-1.5 bg-black');
  
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    if (charCode % 3 === 0) {
      widths.push('w-1 bg-black', 'w-1 bg-white', 'w-2 bg-black', 'w-0.5 bg-white');
    } else if (charCode % 3 === 1) {
      widths.push('w-1.5 bg-black', 'w-0.5 bg-white', 'w-1 bg-black', 'w-1 bg-white');
    } else {
      widths.push('w-0.5 bg-black', 'w-1.5 bg-white', 'w-1.5 bg-black', 'w-1 bg-white');
    }
  }

  widths.push('w-1.5 bg-black', 'w-0.5 bg-white', 'w-1 bg-black');
  return widths;
};

// Sales aggregation for Day, Week, Month
export interface PeriodSalesSummary {
  revenue: number;
  ordersCount: number;
  itemsSoldCount: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  taxTotal: number;
  discountTotal: number;
  avgOrderValue: number;
  bills: SaleBill[];
}

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isWithinDays = (date: Date, referenceDate: Date, days: number): boolean => {
  const diffTime = referenceDate.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
};

export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
};

export const calculateSalesSummary = (bills: SaleBill[]): PeriodSalesSummary => {
  let revenue = 0;
  let itemsSoldCount = 0;
  let totalCost = 0;
  let taxTotal = 0;
  let discountTotal = 0;

  bills.forEach((bill) => {
    revenue += bill.grandTotal;
    taxTotal += bill.taxTotal || 0;
    discountTotal += bill.discountTotal || 0;

    bill.items.forEach((item) => {
      itemsSoldCount += item.quantity;
      const unitCost = item.product.costPrice || 0;
      totalCost += unitCost * item.quantity;
    });
  });

  const ordersCount = bills.length;
  const grossProfit = Number((revenue - totalCost).toFixed(2));
  const grossMarginPercent = revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(1)) : 0;
  const avgOrderValue = ordersCount > 0 ? Number((revenue / ordersCount).toFixed(2)) : 0;

  return {
    revenue: Number(revenue.toFixed(2)),
    ordersCount,
    itemsSoldCount: Number(itemsSoldCount.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    grossProfit,
    grossMarginPercent,
    taxTotal: Number(taxTotal.toFixed(2)),
    discountTotal: Number(discountTotal.toFixed(2)),
    avgOrderValue,
    bills,
  };
};

export const getSalesByPeriods = (allSales: SaleBill[], customNow?: Date) => {
  const now = customNow || new Date();

  // Today (Day)
  const todayBills = allSales.filter((s) => {
    const d = new Date(s.createdAt);
    return isSameDay(d, now);
  });

  // This Week (Last 7 Days)
  const weekBills = allSales.filter((s) => {
    const d = new Date(s.createdAt);
    return isWithinDays(d, now, 7);
  });

  // This Month (Current calendar month or within 30 days)
  const monthBills = allSales.filter((s) => {
    const d = new Date(s.createdAt);
    return isSameMonth(d, now) || isWithinDays(d, now, 30);
  });

  return {
    today: calculateSalesSummary(todayBills),
    week: calculateSalesSummary(weekBills),
    month: calculateSalesSummary(monthBills),
    all: calculateSalesSummary(allSales),
  };
};
