import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Save, Plus, Trash2 } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [keywords, setKeywords] = useState<string[]>(settings.keywords);
  const [newKeyword, setNewKeyword] = useState('');

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      setKeywords([...keywords, newKeyword.trim().toUpperCase()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({ ...settings, keywords });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Configuration</h2>
        <p className="text-slate-500 mb-6 text-sm">
          Define the keywords used to automatically select line items from invoices. 
          When an invoice is processed, any line item description starting with these keywords will be selected and included in the default total calculation.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Default Line Item Keywords
            </label>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                placeholder="Enter keyword (e.g., ВОДООТВЕДЕНИЕ)"
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleAddKeyword}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 min-h-[200px]">
              {keywords.length === 0 ? (
                <p className="text-slate-400 text-sm text-center italic mt-10">No keywords configured.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-slate-200 shadow-sm text-sm text-slate-700">
                      <span>{keyword}</span>
                      <button 
                        onClick={() => handleRemoveKeyword(index)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;