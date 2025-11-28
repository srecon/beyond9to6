
import * as XLSX from 'xlsx';
import { Asset, AssetType, RawAssetRow, PortfolioData, FinancialPlan } from '../types';

export const parseExcelFile = (file: File): Promise<PortfolioData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        let allAssets: Asset[] = [];
        let allPlans: FinancialPlan[] = [];

        // Iterate through all sheets in the workbook
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

          // Check if this is the "Plans" sheet
          if (/plan|future|goal|target/i.test(sheetName)) {
             const sheetPlans = jsonData.map((row, index) => ({
                id: `plan-${index}`,
                quarter: row.Quarter || row.Period || 'Q1',
                goal: row.Goal || row.Target || row.Plan || '',
                status: row.Status || 'Pending',
                notes: row.Notes || ''
             }));
             allPlans = [...allPlans, ...sheetPlans];
             return; // Skip asset parsing for this sheet
          }

          const sheetAssets = jsonData.map((row, index) => {
            let quantity = Number(row.Quantity || row.qty || 0);
            let purchasePrice = Number(row.PurchasePrice || row['Purchase Price'] || row.cost || 0);
            let currentPrice = Number(row.CurrentPrice || row['Current Price'] || row.price || 0);
            
            let totalValue = quantity * currentPrice;
            let totalCost = quantity * purchasePrice;

            // FALLBACK FOR INCOME ROWS (Royalties, Dividends, Trading P/L)
            if (totalValue === 0) {
              const directValue = Number(row.Amount || row.Profit || row.Income || row.Value || row.Revenue || 0);
              if (directValue !== 0) {
                totalValue = directValue;
                totalCost = purchasePrice; 
                if (quantity === 0) quantity = 1; 
                if (currentPrice === 0) currentPrice = totalValue;
              }
            }

            // PASSIVE INCOME CALCULATION
            let projectedMonthlyIncome = 0;
            let incomeYield = 0; // Annual %

            // 1. Explicit Monthly Income
            if (row['Monthly Income'] || row['Monthly Cashflow']) {
               projectedMonthlyIncome = Number(row['Monthly Income'] || row['Monthly Cashflow']);
               if (totalValue > 0) incomeYield = (projectedMonthlyIncome * 12 / totalValue) * 100;
            }
            // 2. Monthly Percentage (e.g., Deposits)
            else if (row['Monthly %'] || row['Monthly Percentage']) {
               const rawVal = row['Monthly %'] || row['Monthly Percentage'];
               let pct = parseFloat(String(rawVal).replace('%', ''));
               // Heuristic: if value < 1 (like 0.05), it might be 5% if formatted as general number
               // But usually in Excel, 5% is stored as 0.05. 
               // However, users typing manually might type "5".
               // If it's a "Monthly" percent, it's rarely > 10.
               if (pct < 1) pct = pct * 100; 
               
               projectedMonthlyIncome = totalValue * (pct / 100);
               incomeYield = pct * 12;
            }
            // 3. Annual Yield / APY / Coupon / Dividend Yield
            else if (row['APY'] || row['Yield'] || row['Coupon'] || row['Annual %'] || row['Dividend Yield']) {
               const rawVal = row['APY'] || row['Yield'] || row['Coupon'] || row['Annual %'] || row['Dividend Yield'];
               let pct = parseFloat(String(rawVal).replace('%', ''));
               if (pct < 1) pct = pct * 100; // Handle 0.05 as 5%

               incomeYield = pct;
               projectedMonthlyIncome = (totalValue * (pct / 100)) / 12;
            }

            const profit = totalValue - totalCost;
            const profitPercentage = totalCost === 0 ? 0 : (profit / totalCost) * 100;

            // Normalize type strategy:
            let typeSource = row.Type ? row.Type.toString() : sheetName; 
            let typeStr = typeSource.trim();
            let type = AssetType.OTHER;
            
            if (/stock|equity|share|portfolio/i.test(typeStr)) type = AssetType.STOCK;
            else if (/crypto|bitcoin|btc|eth|coin|token/i.test(typeStr)) type = AssetType.CRYPTO;
            else if (/etf|fund/i.test(typeStr)) type = AssetType.ETF;
            else if (/bond|debt|treasury/i.test(typeStr)) type = AssetType.BOND;
            else if (/metal|gold|silver|platinum|bullion/i.test(typeStr)) type = AssetType.METAL;
            else if (/royalty|royalties|book|publish|author|copyright|course/i.test(typeStr)) type = AssetType.ROYALTY;
            else if (/salary|wage|paycheck|employment|job/i.test(typeStr)) type = AssetType.SALARY;
            else if (/business|startup|company|venture|llc|inc/i.test(typeStr)) type = AssetType.BUSINESS;
            else if (/rent|lease|airbnb|tenant/i.test(typeStr)) type = AssetType.RENTAL;
            else if (/trading|derivative|option|future|day trade|swing|profit|loss|pnl/i.test(typeStr)) type = AssetType.TRADING;
            else if (/dividend|coupon|yield/i.test(typeStr)) type = AssetType.DIVIDEND;
            else if (/deposit|bank|cd|certificate|saving/i.test(typeStr)) type = AssetType.DEPOSIT;
            else if (/cash|fiat|usd|eur|gbp|currency|money|wallet/i.test(typeStr)) type = AssetType.CASH;
            else if (/liability|loan|mortgage|debt|credit|borrow/i.test(typeStr)) type = AssetType.LIABILITY;
            else if (/real estate|property|house|land/i.test(typeStr)) type = AssetType.REAL_ESTATE;

            // SMART DETECTION FOR LIABILITY
            if (!row.Type) {
              const nameVal = (row.Name || row.Asset || '').toString().toLowerCase();
              const symbolVal = (row.Symbol || row.Ticker || '').toString().toLowerCase();
              const content = `${nameVal} ${symbolVal}`;
              if (/(mortgage|loan|debt|credit\s?card|liability)/i.test(content)) {
                type = AssetType.LIABILITY;
              }
            }

            const safeSheetName = sheetName.replace(/[^a-zA-Z0-9]/g, '');

            return {
              id: `asset-${safeSheetName}-${index}-${Date.now()}`,
              symbol: (row.Symbol || row.Ticker || 'INC').toString().toUpperCase(),
              name: (row.Name || row.Asset || 'Unknown Asset').toString(),
              type,
              quantity,
              purchasePrice,
              currentPrice,
              totalValue,
              totalCost,
              profit,
              profitPercentage,
              incomeYield,
              projectedMonthlyIncome
            };
          });

          allAssets = [...allAssets, ...sheetAssets];
        });

        resolve({ assets: allAssets.filter(a => a.totalValue !== 0), plans: allPlans });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const generateSampleTemplate = () => {
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Crypto (Type: Crypto)
  const cryptoData = [
    { Symbol: 'BTC', Name: 'Bitcoin', Quantity: 0.5, PurchasePrice: 45000, CurrentPrice: 65000 },
    { Symbol: 'ETH', Name: 'Ethereum', Quantity: 5, PurchasePrice: 2500, CurrentPrice: 3500 },
    { Symbol: 'SOL', Name: 'Solana', Quantity: 100, PurchasePrice: 80, CurrentPrice: 140 },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cryptoData), "Crypto Assets");

  // Sheet 2: Stocks & ETFs (Type: Stock, ETF, Dividend)
  const stockData = [
    { Symbol: 'AAPL', Name: 'Apple Inc.', Type: 'Stock', Quantity: 50, PurchasePrice: 150, CurrentPrice: 180 },
    { Symbol: 'VOO', Name: 'Vanguard S&P 500', Type: 'ETF', Quantity: 20, PurchasePrice: 380, CurrentPrice: 450 },
    { Symbol: 'KO', Name: 'Coca-Cola', Type: 'Stock', Quantity: 100, PurchasePrice: 55, CurrentPrice: 60, 'Dividend Yield': 3.1 },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stockData), "Stocks");

  // Sheet 3: Real Estate (Type: Real Estate, Rental)
  const realEstateData = [
    { Symbol: 'HOME', Name: 'Primary Residence', Type: 'Real Estate', Quantity: 1, PurchasePrice: 400000, CurrentPrice: 550000 },
    { Symbol: 'APT-1', Name: 'Rental Apartment', Type: 'Real Estate', Quantity: 1, PurchasePrice: 200000, CurrentPrice: 250000, 'Monthly Income': 1500 },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(realEstateData), "Real Estate");

  // Sheet 4: Bonds & Banking (Type: Bond, Deposit)
  const incomeData = [
    { Symbol: 'US-10Y', Name: 'US Treasury Bond', Type: 'Bond', Quantity: 100, PurchasePrice: 95, CurrentPrice: 98, 'Coupon': 4.5 },
    { Symbol: 'HYSA', Name: 'High Yield Savings', Type: 'Deposit', Quantity: 1, PurchasePrice: 20000, CurrentPrice: 20000, 'APY': 5.0 },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeData), "Bonds and Deposits");

  // Sheet 5: Metals (Type: Metal)
  const metalData = [
    { Symbol: 'GOLD', Name: 'Gold Bar 1oz', Quantity: 5, PurchasePrice: 1800, CurrentPrice: 2100 },
    { Symbol: 'SILVER', Name: 'Silver Coin', Quantity: 50, PurchasePrice: 22, CurrentPrice: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metalData), "Metals");

  // Sheet 6: Income Streams (Type: Salary, Royalty, Business)
  const incomeStreamData = [
    { Symbol: 'JOB', Name: 'Tech Salary', Type: 'Salary', Amount: 5000, 'Monthly Income': 5000 },
    { Symbol: 'BOOK', Name: 'Kindle Book Royalties', Type: 'Royalty', Amount: 300, 'Monthly Income': 300 },
    { Symbol: 'CONSULT', Name: 'Consulting Business', Type: 'Business', Amount: 2000, 'Monthly Income': 2000 },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeStreamData), "Income Sources");

  // Sheet 7: Investment Profit/Loss (Type: Trading)
  const tradingData = [
    { Symbol: 'SPY-SWING', Name: 'S&P Swing Profit Sep', Amount: 1200 },
    { Symbol: 'CRYPTO-DAY', Name: 'Crypto Day Trading', Amount: -400 },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tradingData), "Investment profit loss");

  // Sheet 8: Liabilities (Type: Liability)
  const liabilityData = [
    { Symbol: 'MORTGAGE', Name: 'Home Loan', Quantity: 1, PurchasePrice: 350000, CurrentPrice: 320000 },
    { Symbol: 'VISA', Name: 'Credit Card Debt', Quantity: 1, PurchasePrice: 2500, CurrentPrice: 2500 },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(liabilityData), "Liabilities");

  // Sheet 9: Future Plans
  const planData = [
    { Quarter: 'Q4 2024', Goal: 'Reach $10k monthly passive income', Status: 'In Progress' },
    { Quarter: 'Q1 2025', Goal: 'Buy 5 more oz of Gold', Status: 'Pending' },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(planData), "Future Plans");

  XLSX.writeFile(wb, "WealthFolio_Test_Template.xlsx");
};
