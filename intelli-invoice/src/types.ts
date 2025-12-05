export enum InvoiceStatus {
  DRAFT = 'Draft',
  REVIEWED = 'Reviewed',
  APPROVED = 'Approved',
  PAID = 'Paid'
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  selected?: boolean; // Added for selection checkbox
}

export interface InvoiceData {
  id: string;
  vendorName: string;
  invoiceNumber: string;
  accountNumber?: string; // Added for 'Лицевой счет'
  city?: string; // Added for City extracted from address
  date: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  lineItems: LineItem[];
  status: InvoiceStatus;
  originalImageUrl?: string;
  originalMimeType?: string;
  category?: string;
}

export interface AppSettings {
  keywords: string[];
}

export interface ProcessingStats {
  totalInvoices: number;
  totalSpend: number;
  pendingReview: number;
}