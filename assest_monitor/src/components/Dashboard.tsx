
import React, { useMemo, useState, useEffect } from 'react';
import { Asset, PortfolioSummary, isIncomeType, isLiabilityType, FinancialPlan, PortfolioHistoryItem } from '../types';
import { Card } from './ui/Card';
import AssetTable from './AssetTable';
import { AllocationChart, PerformanceChart } from './Charts';
import AIAnalysis from './AIAnalysis';
import IncomeMindMap from './visualizations/IncomeMindMap';
import AssetPyramid from './visualizations/AssetPyramid';
import HistoryChart from './visualizations/HistoryChart';
import { Wallet, TrendingUp, DollarSign, Upload, Coins, CreditCard, Globe, CheckCircle2, Circle, Save, History, PiggyBank } from 'lucide-react';
import { Language, Currency, TRANSLATIONS, formatCurrency, CURRENCY_SYMBOLS } from '../utils/localization';
import { getHistory, saveSnapshot } from '../utils/historyManager';

interface DashboardProps {
  assets: Asset[];
  plans: FinancialPlan[];
  onReset: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ assets, plans, onReset }) => {
  const [lang, setLang] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [history, setHistory] = useState<PortfolioHistoryItem[]>([]);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const summary: PortfolioSummary = useMemo(() => {
    // Filter categories
    const portfolioAssets = assets.filter(a => !isIncomeType(a.type) && !isLiabilityType(a.type));
    const incomeAssets = assets.filter(a => isIncomeType(a.type));
    const liabilityAssets = assets.filter(a => isLiabilityType(a.type));

    const totalAssetsValue = portfolioAssets.reduce((sum, a) => sum + a.totalValue, 0);
    const totalLiabilitiesValue = liabilityAssets.reduce((sum, a) => sum + a.totalValue, 0);
    const netWorth = totalAssetsValue - totalLiabilitiesValue;

    const totalCost = portfolioAssets.reduce((sum, a) => sum + a.totalCost, 0);
    const totalProfit = totalAssetsValue - totalCost;
    const profitPercentage = totalCost === 0 ? 0 : (totalProfit / totalCost) * 100;

    const totalIncome = incomeAssets.reduce((sum, a) => sum + a.totalValue, 0);
    
    // Calculate projected passive income (sum of all assets' projected monthly income)
    const projectedMonthlyPassiveIncome = assets.reduce((sum, a) => sum + (a.projectedMonthlyIncome || 0), 0);

    // Group for allocation chart (only portfolio assets)
    const allocationMap = portfolioAssets.reduce((acc, asset) => {
      const key = String(asset.type);
      acc[key] = (acc[key] || 0) + asset.totalValue;
      return acc;
    }, {} as Record<string, number>);

    const assetAllocation = Object.entries(allocationMap).map(([name, value]) => ({
      name,
      value: Number(value)
    })).sort((a, b) => b.value - a.value);

    // Find performers (only portfolio assets)
    const sortedByProfit = [...portfolioAssets].sort((a, b) => b.profitPercentage - a.profitPercentage);
    
    return {
      netWorth,
      totalAssetsValue,
      totalLiabilitiesValue,
      totalProfit,
      profitPercentage,
      totalIncome,
      projectedMonthlyPassiveIncome,
      assetAllocation,
      topPerformer: sortedByProfit[0] || null,
      worstPerformer: sortedByProfit[sortedByProfit.length - 1] || null,
    };
  }, [assets]);

  const handleSaveSnapshot = () => {
    const updatedHistory = saveSnapshot(summary);
    setHistory(updatedHistory);
  };

  // Filter for charts to only show portfolio assets
  const portfolioAssetsOnly = assets.filter(a => !isIncomeType(a.type) && !isLiabilityType(a.type));

  const toggleLanguage = () => setLang(l => l === 'en' ? 'ru' : 'en');

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <DollarSign className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hidden sm:block">
              {t.appTitle}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Currency Switcher */}
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              {(['USD', 'EUR', 'RUB'] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    currency === c ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {CURRENCY_SYMBOLS[c]}
                </button>
              ))}
            </div>

            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm bg-slate-800 p-2 rounded-lg border border-slate-700 hover:border-slate-500 transition-all"
            >
              <Globe size={16} />
              <span className="uppercase font-semibold text-xs">{lang}</span>
            </button>

            <button 
              onClick={onReset}
              className="text-sm font-medium text-slate-400 hover:text-white flex items-center gap-2 hover:bg-slate-800 px-3 py-2 rounded-lg transition-all"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">{t.uploadNew}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium">{t.netWorth}</p>
                <h3 className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(summary.netWorth, currency)}
                </h3>
                <div className="flex gap-2 mt-2 text-xs">
                   <span className="text-emerald-400">A: {formatCurrency(summary.totalAssetsValue, currency)}</span>
                   <span className="text-red-400">L: -{formatCurrency(summary.totalLiabilitiesValue, currency)}</span>
                </div>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <Wallet size={24} />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-l-4 border-l-emerald-500">
             <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium">Est. Passive Income / Mo</p>
                <h3 className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(summary.projectedMonthlyPassiveIncome, currency)}
                </h3>
                <p className="text-sm mt-1 text-emerald-400">
                   {((summary.projectedMonthlyPassiveIncome * 12 / (summary.totalAssetsValue || 1)) * 100).toFixed(1)}% Annual Yield
                </p>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <PiggyBank size={24} />
              </div>
            </div>
          </Card>

           <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-l-4 border-l-teal-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium">{t.totalIncome}</p>
                <h3 className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(summary.totalIncome, currency)}
                </h3>
                <p className="text-sm mt-1 text-teal-400">
                  {t.incomeDesc}
                </p>
              </div>
              <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
                <Coins size={24} />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-l-4 border-l-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium">{t.totalLiabilities}</p>
                <h3 className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(summary.totalLiabilitiesValue, currency)}
                </h3>
                 <p className="text-sm mt-1 text-red-400">
                  {t.liabilitiesDesc}
                </p>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                <CreditCard size={24} />
              </div>
            </div>
          </Card>
        </div>

        {/* History Section */}
        <Card 
          title="Yearly Progress" 
          subtitle="Track your Net Worth over time"
          action={
            <button 
              onClick={handleSaveSnapshot}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Save size={14} />
              Save Snapshot
            </button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
              <HistoryChart history={history} currency={currency} />
            </div>
            <div className="md:col-span-1 border-l border-slate-700/50 pl-6 hidden md:block">
              <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <History size={16} /> Log
              </h4>
              <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar">
                {history.slice().reverse().map(item => (
                  <div key={item.id} className="text-xs">
                    <div className="text-slate-400">{new Date(item.date).toLocaleDateString()}</div>
                    <div className="font-semibold text-slate-200">{formatCurrency(item.netWorth, currency)}</div>
                  </div>
                ))}
                {history.length === 0 && <span className="text-xs text-slate-500">No snapshots yet.</span>}
              </div>
            </div>
          </div>
        </Card>

        {/* Visualizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Card title="Wealth Pyramid" subtitle="Foundation to High Risk structure">
             <AssetPyramid assets={assets} currency={currency} />
           </Card>
           <Card title="Income Sources" subtitle="Brainstorming view of revenue streams">
             <IncomeMindMap assets={assets} currency={currency} />
           </Card>
        </div>

        {/* Financial Plans Section */}
        {plans.length > 0 && (
          <Card title={t.financialPlans} className="border-l-4 border-l-indigo-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 flex flex-col justify-between">
                  <div>
                     <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-900/20 px-2 py-0.5 rounded uppercase">
                          {plan.quarter}
                        </span>
                        {plan.status === 'Completed' ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : plan.status === 'In Progress' ? (
                          <Circle size={16} className="text-amber-500" />
                        ) : (
                          <Circle size={16} className="text-slate-600" />
                        )}
                     </div>
                     <p className="text-sm text-slate-200 font-medium leading-tight">
                       {plan.goal}
                     </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <span className="text-xs text-slate-500">{plan.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Main Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title={t.assetAllocation}>
                  <AllocationChart assets={portfolioAssetsOnly} summary={summary} />
                </Card>
                <Card title={t.topAssetsVal}>
                  <PerformanceChart assets={portfolioAssetsOnly} summary={summary} />
                </Card>
              </div>
              <Card title={t.allHoldings} className="overflow-hidden">
                <AssetTable assets={assets} lang={lang} currency={currency} />
              </Card>
           </div>
           
           <div className="lg:col-span-1">
             <AIAnalysis assets={assets} plans={plans} summary={summary} language={lang} />
           </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
