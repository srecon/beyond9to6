export enum AssetType {
  STOCK = 'Stock',
  CRYPTO = 'Crypto',
  REAL_ESTATE = 'Real Estate',
  CASH = 'Cash',
  BOND = 'Bond',
  ETF = 'ETF',
  METAL = 'Metal', // Gold, Silver

  // Income
  BUSINESS = 'Business',
  RENTAL = 'Rental',
  TRADING = 'Trading',
  ROYALTY = 'Royalty',
  SALARY = 'Salary',
  DEPOSIT = 'Deposit',
  DIVIDEND = 'Dividend',

  // Liabilities
  LIABILITY = 'Liability', // Loans, Mortgages

  OTHER = 'Other'
}

export const isIncomeType = (type: AssetType): boolean => {
  return [
    AssetType.ROYALTY,
    AssetType.SALARY,
    AssetType.RENTAL,
    AssetType.TRADING,
    AssetType.BUSINESS,
    AssetType.DIVIDEND
  ].includes(type);
};

export const isLiabilityType = (type: AssetType): boolean => {
  return type === AssetType.LIABILITY;
};

export interface RawAssetRow {
  Symbol?: string;
  Name?: string;
  Type?: string;
  Quantity?: number;
  PurchasePrice?: number;
  CurrentPrice?: number;
  [key: string]: any;
}

export interface FinancialPlan {
  id: string;
  quarter: string;
  goal: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Rejected';
  notes?: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  totalValue: number;
  totalCost: number;
  profit: number;
  profitPercentage: number;
  // New fields for passive income tracking
  incomeYield: number; // Annualized Percentage
  projectedMonthlyIncome: number; // Estimated dollar amount per month
}

export interface PortfolioData {
  assets: Asset[];
  plans: FinancialPlan[];
}

export interface PortfolioSummary {
  netWorth: number;
  totalAssetsValue: number;
  totalLiabilitiesValue: number;
  totalProfit: number;
  profitPercentage: number;
  totalIncome: number;
  projectedMonthlyPassiveIncome: number; // New summary field
  assetAllocation: { name: string; value: number }[];
  topPerformer: Asset | null;
  worstPerformer: Asset | null;
}

export interface PortfolioHistoryItem {
  id: string;
  date: string; // ISO string
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  totalIncome: number;
}
