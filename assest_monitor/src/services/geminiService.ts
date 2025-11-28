
import { GoogleGenAI } from "@google/genai";
import { Asset, PortfolioSummary, isIncomeType, isLiabilityType, FinancialPlan } from "../types";
import { Language } from "../utils/localization";

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzePortfolio = async (
  assets: Asset[],
  plans: FinancialPlan[],
  summary: PortfolioSummary,
  language: Language
): Promise<string> => {
  try {
    const ai = getGeminiClient();
    
    // Separate assets for clearer context
    const portfolioAssets = assets.filter(a => !isIncomeType(a.type) && !isLiabilityType(a.type));
    const incomeAssets = assets.filter(a => isIncomeType(a.type));
    const liabilities = assets.filter(a => isLiabilityType(a.type));

    // Summarize assets
    const assetData = portfolioAssets.map(a => ({
      symbol: a.symbol,
      type: a.type,
      allocation: ((a.totalValue / summary.totalAssetsValue) * 100).toFixed(2) + '%',
      profitPercent: a.profitPercentage.toFixed(2) + '%',
      value: a.totalValue
    }));

    const prompt = `
      You are an expert financial advisor. Analyze the following financial data.
      **IMPORTANT: Respond strictly in ${language === 'ru' ? 'Russian' : 'English'}.**
      
      **Wealth Summary:**
      - Net Worth: $${summary.netWorth.toLocaleString()}
      - Total Assets: $${summary.totalAssetsValue.toLocaleString()}
      - Total Liabilities (Debt): $${summary.totalLiabilitiesValue.toLocaleString()}
      - Total Period Income: $${summary.totalIncome.toLocaleString()}
      
      **User's Future Financial Plans:**
      ${JSON.stringify(plans, null, 2)}
      
      **Liabilities/Debts:**
      ${JSON.stringify(liabilities.map(l => ({ name: l.name, value: l.totalValue })), null, 2)}

      **Investment Assets Breakdown:**
      ${JSON.stringify(assetData, null, 2)}
      
      Please provide a comprehensive analysis in Markdown format, covering:
      1. **Financial Health**: Comment on the Net Worth and Debt-to-Asset ratio.
      2. **Plan Alignment**: Specific advice on how to achieve the "User's Future Financial Plans" listed above based on current holdings.
      3. **Diversification Analysis**: Are the assets well-distributed?
      4. **Risk Assessment**: Identify potential high-risk concentrations.
      5. **Actionable Recommendations**: Suggest 3 specific strategies.
      
      Keep the tone professional. Use bullet points.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: language === 'ru' 
          ? "Вы опытный финансовый консультант. Дайте советы на русском языке." 
          : "You are a senior portfolio manager assisting a retail investor.",
      }
    });

    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return language === 'ru' 
      ? "Произошла ошибка при анализе портфеля."
      : "An error occurred while analyzing the portfolio.";
  }
};
