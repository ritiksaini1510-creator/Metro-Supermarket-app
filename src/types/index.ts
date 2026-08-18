export type UnitType = 'pcs' | 'kg' | 'g' | 'liter' | 'ml' | 'pack' | 'box' | 'dozen';

export type ProductCategory = 
  | 'Fresh Produce'
  | 'Dairy & Eggs'
  | 'Bakery & Snacks'
  | 'Beverages'
  | 'Grains & Staples'
  | 'Packaged Foods'
  | 'Personal Care'
  | 'Household & Cleaning'
  | 'Frozen & Meat'
  | 'Spices & Condiments';

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  brand: string;
  unit: UnitType;
  costPrice: number;       // Purchase price from supplier
  sellingPrice: number;    // Retail MRP / Selling price
  stock: number;           // Current inventory in units
  minStockThreshold: number; // Low stock alert trigger
  taxRate: number;         // Tax/GST percentage (0, 5, 12, 18, etc.)
  expiryDate?: string;     // YYYY-MM-DD
  batchNo?: string;
  location?: string;       // Aisle/Rack e.g. "Aisle 3 - Shelf B"
  supplierId?: string;
  imageUrl?: string;
  isActive: boolean;
  lastRestocked?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountPercent: number; // Item-level discount
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'credit' | 'split';

export interface PaymentDetails {
  method: PaymentMethod;
  cashTendered?: number;
  changeDue?: number;
  cardLast4?: string;
  upiRef?: string;
  splitCash?: number;
  splitOnline?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  storeCredit: number; // Unpaid tabs or advance balance
  totalSpent: number;
  totalVisits: number;
  lastVisit?: string;
}

export interface SaleBill {
  id: string;
  invoiceNumber: string;
  createdAt: string; // ISO string
  items: CartItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number; // Global + item discounts
  grandTotal: number;
  payment: PaymentDetails;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  status: 'completed' | 'refunded' | 'cancelled';
}

export interface ParkedCart {
  id: string;
  name: string;
  items: CartItem[];
  customer?: {
    name: string;
    phone: string;
  };
  parkedAt: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  gstin?: string;
  address: string;
  categoriesSupplied: ProductCategory[];
  totalPurchased: number;
  totalPaid: number;
  balanceDue: number; // totalPurchased - totalPaid
  paymentTerms: string; // e.g. "Net 15", "Net 30", "Immediate"
  rating?: number;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  sku: string;
  unit: UnitType;
  quantity: number;
  costPrice: number;
  taxRate: number;
  subtotal: number;
  total: number;
  batchNo?: string;
  expiryDate?: string;
}

export interface PurchaseOrder {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  receivedDate?: string;
  items: PurchaseItem[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  status: 'received' | 'pending' | 'cancelled';
  notes?: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  date: string;
  quantityChange: number; // Positive for addition, negative for reduction
  previousStock: number;
  newStock: number;
  reason: 'Damage' | 'Expired Stock' | 'Physical Audit Discrepancy' | 'Theft / Shrinkage' | 'Customer Return' | 'Other';
  notes?: string;
  performedBy: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  gstinTaxId: string;
  currencySymbol: string;
  currencyCode: string;
  defaultTaxRate: number;
  receiptFooterMessage: string;
  enableLowStockAlerts: boolean;
  lowStockGlobalThreshold: number;
  expiryWarningDays: number;
  barcodePrefix: string;
  cashierName: string;
}

export interface CashDrawerShift {
  id: string;
  openedAt: string;
  closedAt?: string;
  cashierName: string;
  openingFloat: number;
  cashSales: number;
  onlineSales: number;
  totalSales: number;
  cashDrops: number; // Withdrawals during shift
  expectedCash: number; // openingFloat + cashSales - cashDrops
  actualCount?: number;
  discrepancy?: number;
  status: 'open' | 'closed';
  notes?: string;
}
