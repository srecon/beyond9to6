import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import InvoiceProcessor from './components/InvoiceProcessor';
import Settings from './components/Settings';
import { InvoiceData, InvoiceStatus, AppSettings } from './types';
import { fileToBase64, processInvoiceWithGemini } from './services/geminiService';
import { Layers, Plus, FileText, Settings as SettingsIcon, Search, Bell, Loader } from 'lucide-react';

// Mock Initial Data - Empty as requested
const INITIAL_INVOICES: InvoiceData[] = [];

const DEFAULT_KEYWORDS = [
    "ВОДООТВЕДЕНИЕ",
    "ГОРЯЧЕЕ В/С",
    "ХОЛОДНОЕ В/С",
    "ЭЛЕКТРОСНАБЖЕНИЕ ОДН",
    "ЭЛЕКТРИЧЕСТВО"
];

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'invoices' | 'settings' | 'upload' | 'review'>('dashboard');
  const [invoices, setInvoices] = useState<InvoiceData[]>(INITIAL_INVOICES);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

  const [appSettings, setAppSettings] = useState<AppSettings>({
    keywords: DEFAULT_KEYWORDS
  });

  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const handleSaveInvoice = (updatedInvoice: InvoiceData) => {
    setInvoices(prev => {
      const exists = prev.find(i => i.id === updatedInvoice.id);
      if (exists) {
        return prev.map(i => i.id === updatedInvoice.id ? updatedInvoice : i);
      }
      return [updatedInvoice, ...prev];
    });
    setView('invoices');
    setSelectedInvoice(null);
  };

  const handleOpenInvoice = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice);
    setView('review');
  };

  const handleBulkUpload = async (files: FileList) => {
    setIsBulkProcessing(true);
    const newInvoices: InvoiceData[] = [];

    // Process files sequentially or in parallel. Let's do parallel with Promise.all
    const promises = Array.from(files).map(async (file) => {
      try {
        const base64 = await fileToBase64(file);
        const extractedData = await processInvoiceWithGemini(base64, file.type, appSettings.keywords);

        return {
          ...extractedData,
          originalImageUrl: URL.createObjectURL(file), // Create a blob URL for preview
          originalMimeType: file.type
        } as InvoiceData;
      } catch (e) {
        console.error(`Failed to process file ${file.name}`, e);
        return null;
      }
    });

    const results = await Promise.all(promises);
    results.forEach(res => {
      if (res) newInvoices.push(res);
    });

    setInvoices(prev => [...newInvoices, ...prev]);
    setIsBulkProcessing(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-10 hidden md:flex">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">IntelliInvoice</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <SidebarItem
            icon={<Layers className="w-5 h-5" />}
            label="Dashboard"
            active={view === 'dashboard'}
            onClick={() => setView('dashboard')}
          />
          <SidebarItem
            icon={<FileText className="w-5 h-5" />}
            label="Invoices"
            active={view === 'invoices' || view === 'review'}
            onClick={() => setView('invoices')}
          />
           <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Settings</p>
          </div>
          <SidebarItem
            icon={<SettingsIcon className="w-5 h-5" />}
            label="Configuration"
            active={view === 'settings'}
            onClick={() => setView('settings')}
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500"></div>
             <div>
               <p className="text-sm font-medium text-white">Admin User</p>
               <p className="text-xs text-slate-500">Finance Team</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
             <h1 className="text-xl font-bold text-slate-800 capitalize">
               {view === 'dashboard' ? 'Overview' : view}
             </h1>
          </div>

          <div className="flex items-center gap-4">
            {isBulkProcessing && (
              <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                <Loader className="w-4 h-4 animate-spin" />
                Processing Invoices...
              </div>
            )}
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                className="pl-9 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white border focus:border-indigo-500 rounded-full text-sm w-64 transition-all focus:outline-none"
              />
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50 p-6 lg:p-8">
          {view === 'dashboard' && (
            <Dashboard
              invoices={invoices}
              onUpload={handleBulkUpload}
              isProcessing={isBulkProcessing}
              onReview={handleOpenInvoice}
            />
          )}

          {view === 'invoices' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-800">All Invoices</h3>
                  <div className="text-sm text-slate-500">
                    {invoices.length} documents
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                      <tr>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Vendor</th>
                        <th className="px-6 py-3">City</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                            No invoices found. Upload documents from the dashboard.
                          </td>
                        </tr>
                      ) : (
                        invoices.map((inv) => (
                          <tr
                            key={inv.id}
                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => handleOpenInvoice(inv)}
                          >
                            <td className="px-6 py-4">
                              <StatusBadge status={inv.status} />
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900">{inv.vendorName}</td>
                            <td className="px-6 py-4">{inv.city || '-'}</td>
                            <td className="px-6 py-4">{inv.date}</td>
                            <td className="px-6 py-4 font-medium">{(inv.total || 0).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                {inv.category || 'Uncategorized'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenInvoice(inv);
                                }}
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
          )}

          {view === 'review' || view === 'upload' ? (
             <div className="max-w-7xl mx-auto">
              <InvoiceProcessor
                invoice={selectedInvoice}
                onSave={handleSaveInvoice}
                onCancel={() => {
                  setSelectedInvoice(null);
                  setView('invoices');
                }}
                keywords={appSettings.keywords}
              />
            </div>
          ) : null}

          {view === 'settings' && (
            <Settings
              settings={appSettings}
              onSave={(newSettings) => {
                setAppSettings(newSettings);
                alert("Settings saved!");
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
      active
      ? 'bg-indigo-600/10 text-indigo-400 border-r-2 border-indigo-500'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
    }`}
  >
    {icon}
    {label}
  </button>
);

const StatusBadge: React.FC<{ status: InvoiceStatus }> = ({ status }) => {
  const styles = {
    [InvoiceStatus.DRAFT]: 'bg-slate-100 text-slate-600 border-slate-200',
    [InvoiceStatus.REVIEWED]: 'bg-amber-50 text-amber-700 border-amber-200',
    [InvoiceStatus.APPROVED]: 'bg-blue-50 text-blue-700 border-blue-200',
    [InvoiceStatus.PAID]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles[InvoiceStatus.DRAFT]}`}>
      {status}
    </span>
  );
};

export default App;
