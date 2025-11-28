
import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Download, Link as LinkIcon, FileText } from 'lucide-react';
import { parseExcelFile, generateSampleTemplate } from '../utils/excelParser';
import { Asset, FinancialPlan } from '../types';
import { TRANSLATIONS, Language } from '../utils/localization';

interface FileUploadProps {
  onDataLoaded: (assets: Asset[], plans: FinancialPlan[]) => void;
}

type UploadMode = 'file' | 'google';

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [mode, setMode] = useState<UploadMode>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<{msg: string, directLink?: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  
  const t = TRANSLATIONS['en']; 

  const handleFile = async (file: File) => {
    setError(null);
    setUrlError(null);
    setIsLoading(true);
    
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      setError("Please upload a valid Excel (.xlsx, .xls) file.");
      setIsLoading(false);
      return;
    }

    try {
      const { assets, plans } = await parseExcelFile(file);
      if (assets.length === 0 && plans.length === 0) {
        setError("No valid data found in file. Please check structure.");
      } else {
        onDataLoaded(assets, plans);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to parse file. Ensure it matches the template format.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSheetFetch = async () => {
    setUrlError(null);
    setIsLoading(true);

    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      setUrlError({ msg: "Invalid Google Sheet URL. Could not find Spreadsheet ID." });
      setIsLoading(false);
      return;
    }

    const spreadSheetId = match[1];
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadSheetId}/export?format=xlsx`;

    try {
      const response = await fetch(exportUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const blob = await response.blob();
      const file = new File([blob], "imported_sheet.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      await handleFile(file);
    } catch (err) {
      console.error(err);
      setUrlError({ 
        msg: t.sheetError,
        directLink: exportUrl
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-20 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-4">
          {t.uploadTitle}
        </h1>
        <p className="text-slate-400 text-lg">
          {t.uploadSubtitle}
        </p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button 
            onClick={() => setMode('file')}
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              mode === 'file' ? 'bg-slate-700/50 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Upload size={16} /> {t.uploadFile}
          </button>
          <button 
            onClick={() => setMode('google')}
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              mode === 'google' ? 'bg-slate-700/50 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LinkIcon size={16} /> {t.googleSheets}
          </button>
        </div>

        <div className="p-8">
          {mode === 'file' ? (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
                ${isDragging 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-slate-600 hover:border-slate-500 bg-slate-800/30'
                }
              `}
            >
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={onInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              
              <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-blue-400">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
                  ) : (
                    <FileText size={32} />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {isLoading ? "Processing..." : t.dropFile}
                  </h3>
                  <p className="text-slate-400 mt-2">
                    or <span className="text-blue-400 underline">{t.browse}</span>
                  </p>
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Supports .xlsx, .xls
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-300 mb-1">{t.pasteUrl}</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <button 
                onClick={handleGoogleSheetFetch}
                disabled={!sheetUrl || isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                   <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                   <Download size={18} />
                )}
                {t.fetchSheet}
              </button>
              <p className="text-xs text-slate-500 text-center">
                Make sure the sheet is visible to "Anyone with the link"
              </p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center text-red-400 gap-3 text-sm">
              <AlertCircle size={20} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {urlError && (
             <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex flex-col gap-2 text-amber-400 text-sm">
               <div className="flex items-center gap-3">
                 <AlertCircle size={20} className="flex-shrink-0" />
                 <span>{urlError.msg}</span>
               </div>
               {urlError.directLink && (
                 <div className="ml-8">
                   <a 
                    href={urlError.directLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="underline font-semibold hover:text-amber-300"
                   >
                     {t.downloadXlsx}
                   </a> {t.manualUpload}
                 </div>
               )}
             </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button 
          onClick={generateSampleTemplate}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors py-2 px-4 rounded-full hover:bg-slate-800"
        >
          <FileSpreadsheet size={16} />
          {t.downloadTemplate}
          <Download size={14} />
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
