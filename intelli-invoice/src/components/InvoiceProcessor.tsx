import React, { useState, useRef, useEffect } from 'react';
import { InvoiceData, LineItem } from '../types';
import { processInvoiceWithGemini, fileToBase64 } from '../services/geminiService';
import { Upload, X, Save, CheckCircle, FileText, ArrowLeft, Download, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';

interface InvoiceProcessorProps {
  invoice?: InvoiceData | null; // If provided, acts as Edit Mode
  onSave: (invoice: InvoiceData) => void;
  onCancel: () => void;
  keywords: string[]; // For processing if upload happens here
}

const InvoiceProcessor: React.FC<InvoiceProcessorProps> = ({ invoice, onSave, onCancel, keywords }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoiceData, setInvoiceData] = useState<Partial<InvoiceData> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (invoice) {
      setInvoiceData(invoice);
      if (invoice.originalImageUrl) {
        setPreviewUrl(invoice.originalImageUrl);
        // We simulate a file object if needed, but for display previewUrl is enough
      }
    }
  }, [invoice]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      handleFileSelection(selectedFile);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF or an image file (JPEG, PNG, WebP).");
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    processFile(selectedFile);
  };

  const processFile = async (fileToProcess: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const base64 = await fileToBase64(fileToProcess);
      const extractedData = await processInvoiceWithGemini(base64, fileToProcess.type, keywords);
      setInvoiceData({
        ...extractedData,
        originalImageUrl: URL.createObjectURL(fileToProcess),
        originalMimeType: fileToProcess.type
      });
    } catch (err) {
      console.error(err);
      setError("Failed to process document. Please try again or enter details manually.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadImage = async () => {
    if (formRef.current && invoiceData) {
        try {
            const canvas = await html2canvas(formRef.current, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher quality
                logging: false,
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            const fileName = invoiceData.invoiceNumber 
                ? `Invoice_${invoiceData.invoiceNumber}.png` 
                : `Invoice_${new Date().toISOString().split('T')[0]}.png`;
            link.href = image;
            link.download = fileName;
            link.click();
        } catch (e) {
            console.error("Failed to generate image", e);
            alert("Failed to generate image. Please try again.");
        }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  // If we are in "Edit Mode" (invoice prop exists) OR "Upload Mode" (file selected), show the editor
  const showEditor = invoice || file;

  if (!showEditor) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,.pdf" 
          onChange={handleFileChange} 
        />
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          <Upload className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800">Upload Invoice</h3>
        <p className="text-slate-500 mt-2 text-center max-w-sm">
          Drag and drop your invoice here (PDF or Image).
          <br /><span className="text-xs text-slate-400">Supports PDF, JPG, PNG, WEBP</span>
        </p>
      </div>
    );
  }

  const isPdf = invoice?.originalMimeType === 'application/pdf' || file?.type === 'application/pdf';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]">
      {/* Left Panel: Preview - Always Visible */}
      <div className="bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center relative shadow-lg">
        {previewUrl && isPdf ? (
           <object
             data={previewUrl}
             type="application/pdf"
             className="w-full h-full border-0"
           >
             <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4 text-center">
               <FileText className="w-12 h-12 mb-2 opacity-50" />
               <p>Preview not supported in this browser.</p>
               <a href={previewUrl} download="invoice.pdf" className="text-indigo-400 hover:text-indigo-300 mt-2 underline">
                 Download PDF to view
               </a>
             </div>
           </object>
        ) : previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Invoice Preview" 
            className="max-h-full max-w-full object-contain" 
          />
        ) : (
          <div className="text-white flex flex-col items-center">
            <FileText className="w-12 h-12 mb-2 opacity-50" />
            <span>No Preview Available</span>
          </div>
        )}
        <div className="absolute top-4 left-4 z-20">
           <button onClick={onCancel} className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg backdrop-blur-sm transition-all flex items-center gap-2">
             <ArrowLeft className="w-5 h-5" />
             <span className="text-sm font-medium">Back</span>
           </button>
        </div>
      </div>

      {/* Right Panel: Form or Loading */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden relative">
        {isProcessing ? (
          <div className="absolute inset-0 z-10 bg-white/90 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-semibold text-slate-800">Analyzing Document...</h3>
            <p className="text-slate-500 text-center mt-2 max-w-xs">Gemini is extracting data from your file. This may take a few seconds.</p>
          </div>
        ) : null}

        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <CheckCircle className="w-5 h-5 text-indigo-600" />
             Review & Save
           </h2>
           <div className="flex gap-2">
             <button 
                onClick={handleDownloadImage}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2 border border-transparent hover:border-indigo-100"
                title="Download as Image"
             >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Image</span>
             </button>
             {!invoice && (
                <button 
                    onClick={() => setFile(null)} 
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    disabled={isProcessing}
                >
                Re-upload
                </button>
             )}
             <button 
               onClick={() => invoiceData && onSave(invoiceData as InvoiceData)}
               className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
               disabled={isProcessing || !invoiceData}
             >
               <Save className="w-4 h-4" />
               Save
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={formRef}>
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {invoiceData && (
            <InvoiceForm 
              data={invoiceData} 
              onChange={setInvoiceData} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-component for the form fields
const InvoiceForm: React.FC<{
  data: Partial<InvoiceData>;
  onChange: (data: Partial<InvoiceData>) => void;
}> = ({ data, onChange }) => {
  
  const updateField = (field: keyof InvoiceData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...(data.lineItems || [])];
    
    if (field === 'selected') {
       newItems[index] = { ...newItems[index], selected: value };
       // Recalculate totals based on selected items
       const newSubtotal = newItems.reduce((acc, item) => item.selected ? acc + (item.total || 0) : acc, 0);
       const currentTax = data.tax || 0;
       const newTotal = newSubtotal + currentTax;
       
       onChange({ 
           ...data, 
           lineItems: newItems,
           subtotal: Number(newSubtotal.toFixed(2)),
           total: Number(newTotal.toFixed(2))
       });
    } else {
       newItems[index] = { ...newItems[index], [field]: value };
       // If changing the total of an item, we might want to recalc the global total if it's selected
       if (field === 'total' && newItems[index].selected) {
          const newSubtotal = newItems.reduce((acc, item) => item.selected ? acc + (item.total || 0) : acc, 0);
          const currentTax = data.tax || 0;
          onChange({ 
             ...data, 
             lineItems: newItems,
             subtotal: Number(newSubtotal.toFixed(2)),
             total: Number((newSubtotal + currentTax).toFixed(2))
          });
       } else {
          onChange({ ...data, lineItems: newItems });
       }
    }
  };

  const handleTaxChange = (val: number) => {
      const currentSubtotal = data.subtotal || 0;
      onChange({
          ...data,
          tax: val,
          total: Number((currentSubtotal + val).toFixed(2))
      });
  };

  return (
    <div className="space-y-6 bg-white">
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Vendor Name" value={data.vendorName} onChange={v => updateField('vendorName', v)} />
        <InputField label="City" value={data.city} onChange={v => updateField('city', v)} />
      </div>

       <div className="grid grid-cols-2 gap-4">
        <InputField label="Account Number (Лицевой счет)" value={data.accountNumber} onChange={v => updateField('accountNumber', v)} />
        <InputField label="Invoice #" value={data.invoiceNumber} onChange={v => updateField('invoiceNumber', v)} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <InputField type="date" label="Date" value={data.date} onChange={v => updateField('date', v)} />
        <InputField type="date" label="Due Date" value={data.dueDate} onChange={v => updateField('dueDate', v)} />
        <InputField label="Category" value={data.category} onChange={v => updateField('category', v)} />
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-900 mb-3">Line Items (Виды услуг)</h3>
        <div className="border rounded-lg overflow-hidden border-slate-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 w-10 text-center">#</th>
                <th className="px-3 py-2 w-10 text-center"><input type="checkbox" disabled checked /></th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2 w-20">Qty</th>
                <th className="px-3 py-2 w-24">Price</th>
                <th className="px-3 py-2 w-24 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.lineItems?.map((item, idx) => (
                <tr key={idx} className={item.selected ? 'bg-white' : 'bg-slate-50/50'}>
                   <td className="p-2 text-center text-slate-400 font-mono text-xs">
                     {idx + 1}
                   </td>
                   <td className="p-2 text-center">
                     <input 
                       type="checkbox"
                       checked={item.selected !== false}
                       onChange={(e) => updateLineItem(idx, 'selected', e.target.checked)}
                       className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                     />
                   </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      value={item.description || ''}
                      onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                      className={`w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 ${!item.selected && 'text-slate-400'}`}
                      placeholder="Item description"
                    />
                  </td>
                  <td className="p-2">
                     <input 
                      type="number" 
                      value={item.quantity || ''}
                      onChange={(e) => updateLineItem(idx, 'quantity', parseFloat(e.target.value))}
                      className={`w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 ${!item.selected && 'text-slate-400'}`}
                      placeholder="0"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="number" 
                      value={item.unitPrice || ''}
                      onChange={(e) => updateLineItem(idx, 'unitPrice', parseFloat(e.target.value))}
                      className={`w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 ${!item.selected && 'text-slate-400'}`}
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-2">
                     <input 
                      type="number" 
                      value={item.total || ''}
                      onChange={(e) => updateLineItem(idx, 'total', parseFloat(e.target.value))}
                      className={`w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 text-right ${!item.selected && 'text-slate-400'}`}
                      placeholder="0.00"
                    />
                  </td>
                </tr>
              ))}
              {(!data.lineItems || data.lineItems.length === 0) && (
                 <tr>
                   <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                     No line items detected. Click below to add one manually.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
          <div className="bg-slate-50 p-2 text-center border-t border-slate-200">
            <button 
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              onClick={() => onChange({
                ...data, 
                lineItems: [...(data.lineItems || []), { description: "New Item", quantity: 1, unitPrice: 0, total: 0, selected: true }]
              })}
            >
              + Add Line Item
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 border-t pt-4">
        <div className="flex justify-between w-48 text-sm">
          <span className="text-slate-500">Subtotal:</span>
          <span className="font-medium text-slate-900">{data.subtotal?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="flex justify-between w-48 text-sm">
          <span className="text-slate-500">Tax:</span>
          <input 
            type="number" 
            value={data.tax || 0} 
            onChange={e => handleTaxChange(parseFloat(e.target.value))}
            className="w-20 text-right bg-slate-50 border-b border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-900" 
          />
        </div>
        <div className="flex justify-between w-48 text-lg font-bold text-slate-900 mt-2">
          <span>Total ({data.currency || 'RUB'}):</span>
          <span>{data.total?.toFixed(2) || '0.00'}</span>
        </div>
      </div>
    </div>
  );
};

const InputField: React.FC<{ 
  label: string; 
  value?: string | number; 
  onChange: (val: string) => void;
  type?: string;
}> = ({ label, value, onChange, type = "text" }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
    />
  </div>
);

export default InvoiceProcessor;