
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { PortfolioHistoryItem } from '../../types';
import { Currency, formatCurrency } from '../../utils/localization';

interface HistoryChartProps {
  history: PortfolioHistoryItem[];
  currency: Currency;
}

const HistoryChart: React.FC<HistoryChartProps> = ({ history, currency }) => {
  if (history.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-slate-500 bg-slate-800/20 rounded-lg border border-dashed border-slate-700">
        <p>No history data yet. Save a snapshot to track progress.</p>
      </div>
    );
  }

  // Format dates for display
  const data = history.map(item => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="displayDate" 
            stroke="#94a3b8" 
            tick={{fontSize: 12}}
          />
          <YAxis 
            stroke="#94a3b8" 
            tickFormatter={(val) => `$${val/1000}k`} 
            tick={{fontSize: 12}}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
            formatter={(value: number) => [formatCurrency(value, currency), 'Net Worth']}
          />
          <Area 
            type="monotone" 
            dataKey="netWorth" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorNetWorth)" 
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoryChart;
