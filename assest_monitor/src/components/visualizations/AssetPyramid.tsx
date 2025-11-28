
import React from 'react';
import { Asset, AssetType } from '../../types';
import { Currency, formatCurrency } from '../../utils/localization';

interface AssetPyramidProps {
  assets: Asset[];
  currency: Currency;
}

const AssetPyramid: React.FC<AssetPyramidProps> = ({ assets, currency }) => {
  // Define Layers
  const layers = [
    {
      id: 'high-risk',
      name: 'High Risk / Speculative',
      types: [AssetType.CRYPTO, AssetType.TRADING, AssetType.BUSINESS],
      color: 'from-red-500/80 to-orange-500/80',
      width: '30%'
    },
    {
      id: 'growth',
      name: 'Growth Assets',
      types: [AssetType.STOCK, AssetType.ETF, AssetType.METAL],
      color: 'from-blue-500/80 to-indigo-500/80',
      width: '50%'
    },
    {
      id: 'income',
      name: 'Income & Stability',
      types: [AssetType.BOND, AssetType.DEPOSIT],
      color: 'from-emerald-500/80 to-teal-500/80',
      width: '70%'
    },
    {
      id: 'foundation',
      name: 'Foundation',
      types: [AssetType.REAL_ESTATE, AssetType.CASH],
      color: 'from-slate-600/80 to-slate-700/80',
      width: '90%'
    }
  ];

  // Calculate values for each layer
  const layerData = layers.map(layer => {
    const value = assets
      .filter(a => layer.types.includes(a.type))
      .reduce((sum, a) => sum + a.totalValue, 0);
    return { ...layer, value };
  });

  return (
    <div className="w-full flex flex-col items-center py-6 space-y-2">
      {layerData.map((layer, index) => (
        <div 
          key={layer.id}
          className={`relative group transition-all duration-300 hover:scale-105 cursor-default`}
          style={{ width: layer.width, height: '60px' }}
        >
          {/* Trapezoid Shape using clip-path could be used, but simple boxes for "Modern Pyramid" look cleaner in UI */}
          <div className={`absolute inset-0 bg-gradient-to-r ${layer.color} shadow-lg rounded-lg flex items-center justify-between px-4 border border-white/10`}>
            <span className="text-white font-semibold text-sm drop-shadow-md whitespace-nowrap overflow-hidden text-ellipsis">
              {layer.name}
            </span>
            <span className="text-white font-bold text-sm drop-shadow-md bg-black/20 px-2 py-0.5 rounded">
              {formatCurrency(layer.value, currency)}
            </span>
          </div>
          
          {/* Tooltip for details */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-xs text-white px-2 py-1 rounded border border-slate-600 pointer-events-none whitespace-nowrap z-10">
            Contains: {layer.types.join(', ')}
          </div>
        </div>
      ))}
      <div className="text-slate-500 text-xs mt-4 uppercase tracking-widest font-semibold">
        Risk Pyramid
      </div>
    </div>
  );
};

export default AssetPyramid;
