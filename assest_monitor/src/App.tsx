import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { Asset, FinancialPlan } from './types';

const App: React.FC = () => {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [plans, setPlans] = useState<FinancialPlan[]>([]);

  // Load from local storage
  useEffect(() => {
    const savedAssets = localStorage.getItem('wealthfolio_assets');
    const savedPlans = localStorage.getItem('wealthfolio_plans');

    if (savedAssets) {
      try {
        setAssets(JSON.parse(savedAssets));
      } catch (e) {
        console.error("Failed to restore assets", e);
      }
    }

    if (savedPlans) {
      try {
        setPlans(JSON.parse(savedPlans));
      } catch (e) {
        console.error("Failed to restore plans", e);
      }
    }
  }, []);

  const handleDataLoaded = (loadedAssets: Asset[], loadedPlans: FinancialPlan[]) => {
    setAssets(loadedAssets);
    setPlans(loadedPlans);
    localStorage.setItem('wealthfolio_assets', JSON.stringify(loadedAssets));
    localStorage.setItem('wealthfolio_plans', JSON.stringify(loadedPlans));
  };

  const handleReset = () => {
    setAssets(null);
    setPlans([]);
    localStorage.removeItem('wealthfolio_assets');
    localStorage.removeItem('wealthfolio_plans');
  };

  return (
    <div className="antialiased text-slate-100 min-h-screen bg-slate-900">
      {/* Background ambient light */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10">
        {!assets ? (
          <div className="min-h-screen flex flex-col justify-center">
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>
        ) : (
          <Dashboard assets={assets} plans={plans} onReset={handleReset} />
        )}
      </div>
    </div>
  );
};

export default App;
