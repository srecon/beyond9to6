
import React, { useState } from 'react';
import { Asset, PortfolioSummary, FinancialPlan } from '../types';
import { analyzePortfolio } from '../services/geminiService';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Card } from './ui/Card';
import ReactMarkdown from 'react-markdown';
import { Language, TRANSLATIONS } from '../utils/localization';

interface AIAnalysisProps {
  assets: Asset[];
  plans: FinancialPlan[];
  summary: PortfolioSummary;
  language: Language;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ assets, plans, summary, language }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const t = TRANSLATIONS[language];

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzePortfolio(assets, plans, summary, language);
    setAnalysis(result);
    setLoading(false);
  };

  if (!analysis && !loading) {
    return (
      <Card className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/30">
        <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
          <Sparkles size={32} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{t.aiAnalysis}</h3>
        <p className="text-slate-400 mb-6 max-w-sm">
          {language === 'ru' 
            ? 'Получите профессиональный анализ вашего капитала, планов и обязательств от Gemini AI.'
            : 'Get a professional-grade analysis of your Net Worth, Income Streams, and Asset Allocation powered by Gemini.'
          }
        </p>
        <button
          onClick={handleAnalyze}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/25"
        >
          <Sparkles size={18} />
          {t.analyze}
        </button>
      </Card>
    );
  }

  return (
    <Card 
      title={t.aiAnalysis} 
      className="h-full border-indigo-500/30"
      action={
        <button 
          onClick={handleAnalyze} 
          disabled={loading}
          className="text-slate-400 hover:text-white transition-colors"
          title={t.regenerate}
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      }
    >
      <div className="prose prose-invert prose-sm max-w-none max-h-[500px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
             <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
             </div>
             <p className="text-indigo-300 animate-pulse">{t.consulting}</p>
          </div>
        ) : (
          <ReactMarkdown 
             components={{
                h1: ({node, ...props}) => <h1 className="text-xl font-bold text-indigo-400 mt-4 mb-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-white mt-4 mb-2 border-b border-slate-700 pb-1" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-md font-medium text-slate-200 mt-3 mb-1" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 text-slate-300" {...props} />,
                strong: ({node, ...props}) => <strong className="text-indigo-200" {...props} />,
             }}
          >
            {analysis || ""}
          </ReactMarkdown>
        )}
      </div>
    </Card>
  );
};

export default AIAnalysis;
