
export type Language = 'en' | 'ru';
export type Currency = 'USD' | 'EUR' | 'RUB';

export const CURRENCY_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92, // 1 USD = 0.92 EUR
  RUB: 92.5, // 1 USD = 92.5 RUB
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  RUB: '₽',
};

export const TRANSLATIONS = {
  en: {
    appTitle: "WealthFolio AI",
    uploadTitle: "WealthFolio AI",
    uploadSubtitle: "Upload your portfolio to unlock insights and visualize your wealth.",
    dropFile: "Drop your Excel file here",
    browse: "click to browse",
    downloadTemplate: "Download Sample Template",
    uploadNew: "Upload New File",
    netWorth: "Net Worth",
    totalAssets: "Total Assets",
    totalLiabilities: "Total Liabilities",
    totalIncome: "Total Period Income",
    topAsset: "Top Asset",
    assetAllocation: "Asset Allocation",
    topAssetsVal: "Top Assets by Value",
    allHoldings: "All Holdings & Liabilities",
    aiAnalysis: "AI Wealth Analysis",
    analyze: "Analyze Wealth",
    regenerate: "Regenerate",
    consulting: "Consulting the oracle...",
    symbol: "Symbol",
    name: "Name",
    type: "Type",
    qty: "Qty",
    price: "Price",
    value: "Value",
    pl: "P/L",
    percent: "%",
    incomeDesc: "Salary, Royalties, etc.",
    liabilitiesDesc: "Loans, Credit Cards, Debt",
    financialPlans: "Future Financial Plans",
    planQuarter: "Quarter",
    planGoal: "Goal",
    planStatus: "Status",
    tabs: {
      dashboard: "Dashboard",
      planning: "Planning"
    },
    googleSheets: "Google Sheets",
    uploadFile: "Upload File",
    pasteUrl: "Paste Google Sheets URL",
    fetchSheet: "Fetch Data",
    sheetError: "Could not fetch sheet. Ensure it is visible to anyone with the link, or download it manually:",
    downloadXlsx: "Download as .xlsx",
    manualUpload: "and upload it."
  },
  ru: {
    appTitle: "WealthFolio AI",
    uploadTitle: "WealthFolio AI",
    uploadSubtitle: "Загрузите портфолио для анализа и визуализации вашего капитала.",
    dropFile: "Перетащите Excel файл сюда",
    browse: "нажмите для выбора",
    downloadTemplate: "Скачать шаблон",
    uploadNew: "Загрузить новый файл",
    netWorth: "Чистый капитал",
    totalAssets: "Всего активов",
    totalLiabilities: "Всего обязательств",
    totalIncome: "Доход за период",
    topAsset: "Лучший актив",
    assetAllocation: "Распределение активов",
    topAssetsVal: "Топ активов по стоимости",
    allHoldings: "Все активы и обязательства",
    aiAnalysis: "AI Анализ капитала",
    analyze: "Анализировать",
    regenerate: "Обновить",
    consulting: "Консультация с оракулом...",
    symbol: "Тикер",
    name: "Название",
    type: "Тип",
    qty: "Кол-во",
    price: "Цена",
    value: "Стоимость",
    pl: "П/У",
    percent: "%",
    incomeDesc: "Зарплата, роялти и т.д.",
    liabilitiesDesc: "Кредиты, ипотека, долги",
    financialPlans: "Финансовые планы",
    planQuarter: "Квартал",
    planGoal: "Цель",
    planStatus: "Статус",
    tabs: {
      dashboard: "Дашборд",
      planning: "Планирование"
    },
    googleSheets: "Google Sheets",
    uploadFile: "Загрузить файл",
    pasteUrl: "Вставьте ссылку на Google Sheets",
    fetchSheet: "Получить данные",
    sheetError: "Ошибка доступа. Убедитесь, что доступ открыт, или скачайте вручную:",
    downloadXlsx: "Скачать как .xlsx",
    manualUpload: "и загрузите файл."
  }
};

export const formatCurrency = (value: number, currency: Currency): string => {
  const rate = CURRENCY_RATES[currency];
  const converted = value * rate;
  return new Intl.NumberFormat(currency === 'RUB' ? 'ru-RU' : 'en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(converted);
};
