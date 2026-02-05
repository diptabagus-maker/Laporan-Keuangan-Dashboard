import React, { useState } from "react";
import { Database, RefreshCw, Download, Upload, AlertTriangle, CheckCircle, Info, FileText } from "lucide-react";
import { Button, Card } from "./ui/Primitives";

interface DataSettingsProps {
  onResetData: () => void;
  onExportData: () => void;
  onExportHtml: () => void;
  onImportData: (data: any) => void;
}

export function DataSettings({ onResetData, onExportData, onExportHtml, onImportData }: DataSettingsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importError, setImportError] = useState("");

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        onImportData(data);
        setImportError("");
        alert("Data berhasil diimport!");
      } catch (error) {
        setImportError("Format file tidak valid. Pastikan file JSON yang benar.");
      }
    };
    reader.readAsText(file);
  };

  const getStorageInfo = () => {
    const operationalMenus = localStorage.getItem("operationalMenus");
    const savingsMenus = localStorage.getItem("savingsMenus");
    const transactions = localStorage.getItem("transactions");
    
    const totalSize = (
      (operationalMenus?.length || 0) +
      (savingsMenus?.length || 0) +
      (transactions?.length || 0)
    );

    return {
      hasData: !!operationalMenus || !!savingsMenus || !!transactions,
      size: (totalSize / 1024).toFixed(2) + " KB"
    };
  };

  const storageInfo = getStorageInfo();

  return (
    <div className="space-y-4">
      {/* Storage Status Card */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
            <Database size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Status Penyimpanan Data</h3>
            <p className="text-sm text-gray-600 mb-3">
              Data disimpan secara otomatis di browser Anda menggunakan LocalStorage
            </p>
            <div className="flex items-center gap-2 text-sm">
              {storageInfo.hasData ? (
                <>
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-green-700 font-medium">Data tersimpan ({storageInfo.size})</span>
                </>
              ) : (
                <>
                  <Info size={16} className="text-gray-600" />
                  <span className="text-gray-700">Belum ada data tersimpan</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Data Management Actions */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Kelola Data</h3>
        
        <div className="space-y-3">
          {/* Export Data */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Download size={20} className="text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Export Backup Data (JSON)</p>
                <p className="text-xs text-gray-500">Unduh semua data untuk backup/restore</p>
              </div>
            </div>
            <Button
              onClick={onExportData}
              variant="secondary"
              className="text-sm"
            >
              Export JSON
            </Button>
          </div>

          {/* Export HTML Report */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">Export Laporan Lengkap (HTML)</p>
                <p className="text-xs text-gray-500">Unduh laporan siap cetak untuk semua menu</p>
              </div>
            </div>
            <Button
              onClick={onExportHtml}
              variant="secondary"
              className="text-sm"
            >
              Export HTML
            </Button>
          </div>

          {/* Import Data */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Upload size={20} className="text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Import Data</p>
                <p className="text-xs text-gray-500">Restore data dari file JSON</p>
              </div>
            </div>
            <label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <Button
                as="span"
                variant="secondary"
                className="text-sm cursor-pointer"
              >
                Import
              </Button>
            </label>
          </div>
          
          {importError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{importError}</span>
            </div>
          )}

          {/* Reset Data */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-3">
              <RefreshCw size={20} className="text-red-600" />
              <div>
                <p className="font-medium text-gray-900">Reset Data</p>
                <p className="text-xs text-gray-500">Kembalikan ke data awal (tidak bisa dibatalkan)</p>
              </div>
            </div>
            <Button
              onClick={() => setShowResetConfirm(true)}
              className="text-sm bg-red-600 hover:bg-red-700 text-white"
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Reset Semua Data?
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Semua transaksi, menu, dan pengaturan akan dihapus dan dikembalikan ke data awal. 
                Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    onResetData();
                    setShowResetConfirm(false);
                  }}
                >
                  Reset Data
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
