
import React, { useState } from 'react';
import { Asset, AssetType } from '../types';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from 'lucide-react';
import { Language, Currency, formatCurrency, TRANSLATIONS } from '../utils/localization';

interface AssetTableProps {
  assets: Asset[];
  lang: Language;
  currency: Currency;
}

type SortKey = keyof Asset;
type SortDirection = 'asc' | 'desc';

const AssetTable: React.FC<AssetTableProps> = ({ assets, lang, currency }) => {
  const [sortKey, setSortKey] = useState<SortKey>('totalValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const t = TRANSLATIONS[lang];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown size={14} className="opacity-30" />;
    return sortDirection === 'asc' ? <ArrowUp size={14} className="text-blue-400" /> : <ArrowDown size={14} className="text-blue-400" />;
  };

  const Header = ({ label, column, align = 'left' }: { label: string, column: SortKey, align?: 'left' | 'right' }) => (
    <th 
      className={`px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-800/50 hover:text-white transition-colors text-${align}`}
      onClick={() => handleSort(column)}
    >
      <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
        {label} <SortIcon column={column} />
      </div>
    </th>
  );

  // Grouping Logic
  const groupedAssets: Record<string, Asset[]> = {};
  
  // Sort first
  const sortedAssets = [...assets].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortDirection === 'asc' ? (Number(aValue) - Number(bValue)) : (Number(bValue) - Number(aValue));
  });

  sortedAssets.forEach(asset => {
    // Custom Group Mapping
    let group = 'Other';
    switch (asset.type) {
      case AssetType.REAL_ESTATE:
      case AssetType.CASH:
      case AssetType.DEPOSIT:
        group = 'Foundation (Cash & Property)';
        break;
      case AssetType.STOCK:
      case AssetType.ETF:
      case AssetType.BOND:
      case AssetType.METAL:
        group = 'Investments';
        break;
      case AssetType.CRYPTO:
      case AssetType.BUSINESS:
        group = 'High Risk / Speculative';
        break;
      case AssetType.SALARY:
      case AssetType.ROYALTY:
      case AssetType.RENTAL:
      case AssetType.TRADING:
      case AssetType.DIVIDEND:
        group = 'Income Sources';
        break;
      case AssetType.LIABILITY:
        group = 'Liabilities';
        break;
      default:
        group = 'Other Assets';
    }
    
    if (!groupedAssets[group]) groupedAssets[group] = [];
    groupedAssets[group].push(asset);
  });

  // Order groups
  const groupOrder = [
    'Foundation (Cash & Property)',
    'Investments',
    'High Risk / Speculative',
    'Income Sources',
    'Liabilities',
    'Other Assets'
  ];

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full whitespace-nowrap">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800/30">
            <Header label={t.symbol} column="symbol" />
            <Header label={t.name} column="name" />
            <Header label={t.type} column="type" />
            <Header label={t.qty} column="quantity" align="right" />
            <Header label={t.price} column="currentPrice" align="right" />
            <Header label={t.value} column="totalValue" align="right" />
            <Header label="Yield / Mo. Inc" column="projectedMonthlyIncome" align="right" />
            <Header label={t.pl} column="profit" align="right" />
            <Header label={t.percent} column="profitPercentage" align="right" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {groupOrder.map(groupName => {
            const assetsInGroup = groupedAssets[groupName];
            if (!assetsInGroup || assetsInGroup.length === 0) return null;

            const isCollapsed = collapsedGroups[groupName];
            const groupTotal = assetsInGroup.reduce((sum, a) => sum + (a.type === AssetType.LIABILITY ? -Math.abs(a.totalValue) : a.totalValue), 0);
            const groupMonthlyIncome = assetsInGroup.reduce((sum, a) => sum + (a.projectedMonthlyIncome || 0), 0);

            return (
              <React.Fragment key={groupName}>
                {/* Group Header */}
                <tr className="bg-slate-800/80 hover:bg-slate-800 cursor-pointer" onClick={() => toggleGroup(groupName)}>
                  <td colSpan={9} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isCollapsed ? <ChevronRight size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                        <span className="font-bold text-slate-200 text-sm">{groupName}</span>
                        <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">{assetsInGroup.length}</span>
                      </div>
                      <div className="flex items-center gap-6">
                         {groupMonthlyIncome > 0 && (
                            <span className="font-mono text-xs text-emerald-300">
                              <span className="text-slate-500 mr-1">Mo. Inc:</span> 
                              +{formatCurrency(groupMonthlyIncome, currency)}
                            </span>
                         )}
                         <span className={`font-mono font-medium text-sm ${groupName === 'Liabilities' ? 'text-red-400' : 'text-emerald-400'}`}>
                           {formatCurrency(groupTotal, currency)}
                         </span>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Group Rows */}
                {!isCollapsed && assetsInGroup.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors bg-slate-900/20">
                    <td className="px-4 py-3 text-sm font-medium text-white pl-8 border-l-2 border-slate-800">{asset.symbol}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{asset.name}</td>
                    <td className="px-4 py-3 text-sm">
                       <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide
                        ${asset.type === 'Stock' ? 'bg-blue-900/20 text-blue-400' : 
                          asset.type === 'Crypto' ? 'bg-orange-900/20 text-orange-400' :
                          asset.type === 'ETF' ? 'bg-purple-900/20 text-purple-400' :
                          asset.type === 'Metal' ? 'bg-yellow-600/20 text-yellow-300' :
                          asset.type === 'Cash' ? 'bg-green-900/20 text-green-400' :
                          asset.type === 'Deposit' ? 'bg-teal-900/20 text-teal-400' :
                          asset.type === 'Liability' ? 'bg-red-900/20 text-red-400' :
                          asset.type === 'Business' ? 'bg-pink-900/20 text-pink-400' :
                          asset.type === 'Trading' ? 'bg-cyan-900/20 text-cyan-400' :
                          asset.type === 'Royalty' ? 'bg-indigo-900/20 text-indigo-400' :
                          asset.type === 'Dividend' ? 'bg-lime-900/20 text-lime-400' :
                          asset.type === 'Bond' ? 'bg-amber-900/20 text-amber-400' :
                          'bg-slate-800 text-slate-400'}`}>
                        {asset.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right">{asset.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right">{formatCurrency(asset.currentPrice, currency)}</td>
                    <td className={`px-4 py-3 text-sm font-bold text-right ${asset.totalValue < 0 ? 'text-red-400' : 'text-white'}`}>
                      {formatCurrency(asset.totalValue, currency)}
                    </td>
                    
                    {/* Yield / Income Column */}
                    <td className="px-4 py-3 text-sm text-right">
                       {asset.projectedMonthlyIncome > 0 ? (
                         <div className="flex flex-col items-end">
                            <span className="text-emerald-400 font-medium">+{formatCurrency(asset.projectedMonthlyIncome, currency)}</span>
                            {asset.incomeYield > 0 && (
                               <span className="text-[10px] text-slate-500">{asset.incomeYield.toFixed(2)}% APY</span>
                            )}
                         </div>
                       ) : (
                         <span className="text-slate-600">-</span>
                       )}
                    </td>

                    <td className={`px-4 py-3 text-sm font-medium text-right ${asset.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {asset.profit >= 0 ? '+' : ''}{formatCurrency(asset.profit, currency)}
                    </td>
                     <td className={`px-4 py-3 text-sm font-medium text-right ${asset.profitPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {asset.profitPercentage >= 0 ? '+' : ''}{asset.profitPercentage.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AssetTable;
