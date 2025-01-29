import React, { useState } from 'react';
import { Settings, X, Trash2, Download, Info } from 'lucide-react';
import type { OllamaModel, ModelDetails } from '../types';

interface ModelSettingsProps {
  models: OllamaModel[];
  onClose: () => void;
  onModelChange: () => void;
}

export function ModelSettings({ models, onClose, onModelChange }: ModelSettingsProps) {
  const [selectedModelInfo, setSelectedModelInfo] = useState<ModelDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDeleteModel = async (modelName: string) => {
    if (!confirm(`Are you sure you want to delete ${modelName}?`)) return;
    
    try {
      setLoading(true);
      const response = await fetch('http://localhost:11434/api/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });
      
      if (response.ok) {
        onModelChange();
      } else {
        alert('Failed to delete model');
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      alert('Error deleting model');
    } finally {
      setLoading(false);
    }
  };

  const handlePullModel = async () => {
    const modelName = prompt('Enter the model name to pull (e.g., llama2:latest):');
    if (!modelName) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:11434/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });
      
      if (response.ok) {
        onModelChange();
      } else {
        alert('Failed to pull model');
      }
    } catch (error) {
      console.error('Error pulling model:', error);
      alert('Error pulling model');
    } finally {
      setLoading(false);
    }
  };

  const fetchModelInfo = async (modelName: string) => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:11434/api/show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedModelInfo(data);
      }
    } catch (error) {
      console.error('Error fetching model info:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden transition-colors">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
            <Settings className="w-5 h-5" />
            Model Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 dark:text-gray-300" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
          <div className="flex justify-end mb-4">
            <button
              onClick={handlePullModel}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Pull New Model
            </button>
          </div>

          <div className="space-y-4">
            {models.map((model) => (
              <div
                key={model.name}
                className="border dark:border-gray-700 rounded-lg p-4 space-y-4 dark:bg-gray-900 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium dark:text-white">{model.name}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchModelInfo(model.name)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      title="Show model info"
                    >
                      <Info className="w-4 h-4 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => handleDeleteModel(model.name)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-red-600 dark:text-red-400 transition-colors"
                      title="Delete model"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {selectedModelInfo && model.details && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <p>Format: {model.details.format}</p>
                    <p>Family: {model.details.family}</p>
                    <p>Size: {model.details.parameter_size}</p>
                    <p>Quantization: {model.details.quantization_level}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}