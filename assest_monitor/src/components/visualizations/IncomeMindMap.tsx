
import React from 'react';
import { Asset, AssetType } from '../../types';
import { Currency, formatCurrency } from '../../utils/localization';

interface IncomeMindMapProps {
  assets: Asset[];
  currency: Currency;
}

const IncomeMindMap: React.FC<IncomeMindMapProps> = ({ assets, currency }) => {
  // Filter only income types
  const incomeAssets = assets.filter(a => [
    AssetType.SALARY, 
    AssetType.ROYALTY, 
    AssetType.BUSINESS, 
    AssetType.RENTAL, 
    AssetType.TRADING,
    AssetType.DIVIDEND,
    AssetType.DEPOSIT // Interest often considered income
  ].includes(a.type));

  const totalIncome = incomeAssets.reduce((sum, a) => sum + a.totalValue, 0);

  // Group by Type
  const groupedIncome = incomeAssets.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + asset.totalValue;
    return acc;
  }, {} as Record<string, number>);

  const nodes = Object.entries(groupedIncome).map(([type, value]) => ({
    type,
    value: value as number,
    color: getTypeColor(type)
  }));

  // Layout calculations
  const centerX = 250;
  const centerY = 200;
  const radius = 140;

  return (
    <div className="w-full h-[400px] flex items-center justify-center overflow-hidden relative select-none">
      <svg width="500" height="400" viewBox="0 0 500 400" className="w-full h-full">
        {/* Connections */}
        {nodes.map((node, i) => {
          const angle = (i * (360 / nodes.length)) * (Math.PI / 180);
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          
          return (
            <line 
              key={`line-${i}`}
              x1={centerX} 
              y1={centerY} 
              x2={x} 
              y2={y} 
              stroke="#475569" 
              strokeWidth="2" 
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Center Node */}
        <circle cx={centerX} cy={centerY} r="60" fill="#1e293b" stroke="#3b82f6" strokeWidth="3" />
        <foreignObject x={centerX - 50} y={centerY - 30} width="100" height="60">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-xs text-slate-400 font-bold uppercase">Total Income</span>
            <span className="text-sm font-bold text-white">{formatCurrency(totalIncome, currency)}</span>
          </div>
        </foreignObject>

        {/* Leaf Nodes */}
        {nodes.map((node, i) => {
          const angle = (i * (360 / nodes.length)) * (Math.PI / 180);
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          
          return (
            <g key={`node-${i}`}>
               {/* Sticky Note Effect */}
               <rect 
                 x={x - 50} 
                 y={y - 30} 
                 width="100" 
                 height="60" 
                 rx="4"
                 fill={node.color}
                 className="drop-shadow-lg"
                 transform={`rotate(${Math.random() * 6 - 3}, ${x}, ${y})`}
               />
               <foreignObject x={x - 50} y={y - 30} width="100" height="60">
                <div className="flex flex-col items-center justify-center h-full text-center p-1">
                  <span className="text-xs font-bold text-slate-900 uppercase leading-none mb-1">{node.type}</span>
                  <span className="text-xs font-semibold text-slate-800">{formatCurrency(node.value, currency)}</span>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Helper for vibrant sticky note colors
const getTypeColor = (type: string) => {
  switch (type) {
    case 'Salary': return '#a7f3d0'; // Green
    case 'Business': return '#fbcfe8'; // Pink
    case 'Royalty': return '#fde68a'; // Yellow
    case 'Rental': return '#bae6fd'; // Blue
    case 'Trading': return '#fed7aa'; // Orange
    case 'Dividend': return '#bef264'; // Lime
    case 'Deposit': return '#e2e8f0'; // Slate
    default: return '#e2e8f0';
  }
};

export default IncomeMindMap;
