
import { PortfolioHistoryItem, PortfolioSummary } from '../types';

const STORAGE_KEY = 'wealthfolio_history';

export const getHistory = (): PortfolioHistoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveSnapshot = (summary: PortfolioSummary): PortfolioHistoryItem[] => {
  const history = getHistory();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Check if we already have an entry for today/this month? 
  // For simplicity, we allow one snapshot per day, overwriting if exists
  const filteredHistory = history.filter(item => !item.date.startsWith(today));
  
  const newItem: PortfolioHistoryItem = {
    id: `snap-${Date.now()}`,
    date: new Date().toISOString(),
    netWorth: summary.netWorth,
    totalAssets: summary.totalAssetsValue,
    totalLiabilities: summary.totalLiabilitiesValue,
    totalIncome: summary.totalIncome
  };
  
  const newHistory = [...filteredHistory, newItem].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  return newHistory;
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};
