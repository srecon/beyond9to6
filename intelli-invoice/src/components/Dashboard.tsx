import React, { useMemo, useRef } from 'react';
import { InvoiceData, InvoiceStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { FileText, CheckCircle, Clock, Download, Upload, Loader, ArrowRight, Info } from 'lucide-react';

interface DashboardProps {
  invoices: InvoiceData[];
  onUpload: (files: FileList) => void;
  isProcessing: boolean;
  onReview: (invoice: InvoiceData) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, onUpload, isProcessing, onReview }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    return {
      totalSpend: invoices.reduce((acc, inv) => acc + (inv.total || 0), 0),
      totalInvoices: invoices.length,
      pending: invoices.filter(i => i.status === InvoiceStatus.DRAFT || i.status === InvoiceStatus.REVIEWED).length,
      paid: invoices.filter(i => i.status === InvoiceStatus.PAID).length,
    };
  }, [invoices]);

  // Group spend by City for the requested summary text
  const cityGroups = useMemo(() => {
    const groups: Record<string, number> = {};
    invoices.forEach(inv => {
      // Use City if available, otherwise Vendor Name, otherwise 'Unknown'
      const key = inv.city ? inv.city : (inv.vendorName || 'Unknown');
      groups[key] = (groups[key] || 0) + (inv.total || 0);
    });
    return groups;
  }, [invoices]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach(inv => {
      const cat = inv.category || 'Uncategorized';
      map.set(cat, (map.get(cat) || 0) + (inv.total || 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [invoices]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach(inv => {
      if (!inv.date) return;
      const month = new Date(inv.date).toLocaleString('default', { month: 'short' });
      map.set(month, (map.get(month) || 0) + (inv.total || 0));
    });
    return Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
  }, [invoices]);

  const handleExport = () => {
    const headers = ['ID', 'Vendor', 'Account Number', 'City', 'Invoice Number', 'Date', 'Due Date', 'Total', 'Currency', 'Category', 'Status'];
    const rows = invoices.map(inv => [
      inv.id,
      `"${inv.vendorName.replace(/"/g, '""')}"`,
      `"${(inv.accountNumber || '').replace(/"/g, '""')}"`,
      `"${(inv.city || '').replace(/"/g, '""')}"`,
      `"${(inv.invoiceNumber || '').replace(/"/g, '""')}"`,
      inv.date,
      inv.dueDate,
      inv.total,
      inv.currency,
      inv.category,
      inv.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'invoices_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Fixed: Allow any type input to handle 'unknown' type errors from chart libraries
  const formatCurrency = (value: any) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(Number(value) || 0);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Upload Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Upload Invoices</h2>
          <p className="text-indigo-100 max-w-xl">
            Upload your payment invoices (PDF or Image). The system will extract the data and provide a spending breakdown automatically.
          </p>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-lg font-semibold shadow-md transition-all flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            {isProcessing ? 'Processing...' : 'Upload Documents'}
          </button>
        </div>
      </div>

      {/* Spending Summary Text Block */}
      {invoices.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl shadow-sm flex items-start gap-4">
          <div className="bg-indigo-100 p-2 rounded-full shrink-0 text-indigo-600">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-indigo-900 mb-1">Total Spending Breakdown</h3>
            <p className="text-indigo-800 text-lg leading-relaxed">
              Total spend <span className="font-bold">{formatCurrency(stats.totalSpend)}</span>.
              {Object.entries(cityGroups).map(([city, amount], idx, arr) => (
                  <span key={city}>
                      {idx === 0 ? ' ' : ' '}
                      For Invoice <span className="font-semibold">{city}</span> <span className="font-bold">{formatCurrency(amount)}</span>
                      {idx < arr.length - 1 ? ' and' : '.'}
                  </span>
              ))}
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Spend"
          value={formatCurrency(Number(stats.totalSpend))}
          icon={<div className="font-bold text-indigo-600 w-6 h-6 flex items-center justify-center">₽</div>}
        />
        <StatsCard
          title="Total Invoices"
          value={stats.totalInvoices.toString()}
          icon={<FileText className="w-6 h-6 text-blue-600" />}
        />
        <StatsCard
          title="Pending Review"
          value={stats.pending.toString()}
          icon={<Clock className="w-6 h-6 text-amber-600" />}
        />
        <StatsCard
          title="Paid Invoices"
          value={stats.paid.toString()}
          icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
        />
      </div>

      {/* Detailed Invoice List with Review Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-800">Uploaded Invoices</h3>
          <p className="text-sm text-slate-500">Review individual documents to approve payments.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {invoices.length === 0 ? (
            <p className="p-12 text-center text-slate-400 italic">No invoices uploaded yet.</p>
          ) : (
            invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-5 flex flex-col sm:flex-row items-center justify-between hover:bg-slate-50 transition-colors gap-4 group cursor-pointer"
                onClick={() => onReview(inv)}
              >
                <div className="flex items-center gap-5 w-full sm:w-auto">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${inv.city ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                     <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-lg">
                        {inv.city ? `Invoice ${inv.city}` : inv.vendorName}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                        inv.status === InvoiceStatus.DRAFT ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-green-100 border-green-200 text-green-700'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {inv.accountNumber ? `Account: ${inv.accountNumber}` : 'No Account #'} • {inv.date || 'No Date'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                   <div className="text-right">
                      <p className="font-bold text-slate-900 text-xl">{formatCurrency(inv.total || 0)}</p>
                      <p className="text-xs text-slate-400">Total Amount</p>
                   </div>
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       onReview(inv);
                     }}
                     className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm hover:shadow group-hover:translate-x-1"
                   >
                     Review Invoice
                     <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Analytics Charts */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Spend by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
               {categoryData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center text-xs text-slate-600">
                    <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    {entry.name}
                  </div>
               ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Monthly Spending</h3>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} tickFormatter={(value) => `₽${value}`} />
                  <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Amount']} />
                  <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatsCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
    </div>
    <div className="p-3 bg-slate-50 rounded-full">
      {icon}
    </div>
  </div>
);

export default Dashboard;
