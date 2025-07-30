'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Upload, 
  Download, 
  ArrowLeft, 
  FileText, 
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

interface UploadResult {
  message: string;
  summary: {
    totalRows: number;
    categoriesCreated: number;
    mealPlansCreated: number;
    mealItemsCreated: number;
    duplicatesSkipped: number;
  };
}

export default function MealPlanUploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Redirect if not authenticated or not manager/admin
  if (session && session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
    router.push('/');
    return null;
  }

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    setSelectedFile(file);
    setError('');
    setUploadResult(null);
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/meal-planning/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadResult(data);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  // Download template
  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/meal-planning/upload');
      const csvContent = await response.text();
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meal_planning_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Failed to download template');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/manager/meal-planning"
                className="flex items-center text-teal-600 hover:text-teal-700"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Upload Meal Plans</h1>
                <p className="mt-2 text-gray-600">
                  Bulk upload meal plans using CSV file
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">How to Upload Meal Plans</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
              <span>Download the CSV template to see the required format</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
              <span>Fill in your meal plans with dates, meal types, categories, and menu items</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
              <span>Save as CSV and upload the file below</span>
            </div>
          </div>
        </div>

        {/* Download Template */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">CSV Template</h3>
              <p className="text-gray-600">
                Download the template to see the correct format for your meal plans
              </p>
            </div>
            <button
              onClick={() => void downloadTemplate()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Download Template</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Upload Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadResult && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-green-900 font-semibold mb-2">{uploadResult.message}</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">{uploadResult.summary.totalRows}</div>
                    <div className="text-green-600">Total Rows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">{uploadResult.summary.categoriesCreated}</div>
                    <div className="text-green-600">Categories Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">{uploadResult.summary.mealPlansCreated}</div>
                    <div className="text-green-600">Meal Plans Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-800">{uploadResult.summary.mealItemsCreated}</div>
                    <div className="text-green-600">Menu Items Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{uploadResult.summary.duplicatesSkipped}</div>
                    <div className="text-gray-500">Duplicates Skipped</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h3>
          
          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-teal-500 bg-teal-50'
                : selectedFile
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="space-y-3">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-gray-600">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setError('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-red-600 hover:text-red-700 text-sm flex items-center space-x-1 mx-auto"
                >
                  <X className="w-4 h-4" />
                  <span>Remove file</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your CSV file here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-teal-600 hover:text-teal-700 underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-gray-600">Only CSV files are supported</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => void handleUpload()}
              disabled={!selectedFile || uploading}
              className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>{uploading ? 'Uploading...' : 'Upload Meal Plans'}</span>
            </button>
          </div>
        </div>

        {/* CSV Format Guide */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CSV Format Guide</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Column</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Description</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 px-3 font-medium">Date</td>
                  <td className="py-2 px-3 text-gray-600">Date in YYYY-MM-DD format</td>
                  <td className="py-2 px-3 text-gray-600">2025-07-29</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Meal_Type</td>
                  <td className="py-2 px-3 text-gray-600">BREAKFAST, LUNCH, or DINNER</td>
                  <td className="py-2 px-3 text-gray-600">BREAKFAST</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Category_Name</td>
                  <td className="py-2 px-3 text-gray-600">Name of meal category</td>
                  <td className="py-2 px-3 text-gray-600">South Indian Veg</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Item_1 to Item_8</td>
                  <td className="py-2 px-3 text-gray-600">Menu items for the meal</td>
                  <td className="py-2 px-3 text-gray-600">Idli, Sambar, Chutney</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 