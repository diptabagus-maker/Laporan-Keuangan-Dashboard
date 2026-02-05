import React, { useState } from "react";
import { PiggyBank, ArrowRight, Undo2, Calendar, AlertCircle, CheckCircle, Wallet } from "lucide-react";
import { Button, Card } from "./ui/Primitives";
import { Transaction } from "./TransactionManager";
import { MenuItem } from "./Sidebar";

interface OperationalSavingUnifiedProps {
  operationalMenus: MenuItem[];
  allOperationalTransactions: Record<string, Transaction[]>;
  savingTransactions: Transaction[];
  onTransferToSaving: (fromDivisionId: string, amount: number) => void;
  onCancelTransfer: (transferId: string) => void;
}

export function OperationalSavingUnified({
  operationalMenus,
  allOperationalTransactions,
  savingTransactions,
  onTransferToSaving,
  onCancelTransfer,
}: OperationalSavingUnifiedProps) {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState("");

  // 1. Get all unique division names from both operational menus AND saving transaction history
  const allDivisionNames = Array.from(new Set([
    ...operationalMenus.filter(m => m.id !== 'operational_saving' && m.id !== 'operational_division').map(m => m.label),
    ...savingTransactions.map(t => t.category).filter(Boolean)
  ])).sort();

  // 2. Calculate balance and totals for each unique division
  const divisionsBalance = allDivisionNames.map(divisionName => {
    // A division could have its own menu OR be part of the 'operational_division' checklist
    const menu = operationalMenus.find(m => m.label === divisionName);

    // Transactions from its own dedicated menu (if any)
    const specificTransactions = menu ? allOperationalTransactions[menu.id] || [] : [];

    // Transactions from the general 'operational_division' checklist where this name is the category
    const checklistTransactions = (allOperationalTransactions['operational_division'] || [])
      .filter(t => t.category === divisionName);

    // Summing Allocated Saving:
    // a. From dedicated menu: transactions marked Category = 'Saving'
    const fromSpecificMenu = specificTransactions.reduce((sum, t) => {
      if (t.category === 'Saving') return t.type === 'out' ? sum + t.amount : sum - t.amount;
      return sum;
    }, 0);

    // b. From checklist: transactions with description including "Dialihkan ke Saving"
    const fromChecklist = checklistTransactions.reduce((sum, t) => {
      if (t.description?.includes("Dialihkan ke Saving")) return sum + t.amount;
      return sum;
    }, 0);

    const allocatedSaving = fromSpecificMenu + fromChecklist;

    // Summing Transferred to Saving (Actual deposits in savingTransactions pool)
    const transferred = savingTransactions
      .filter(t => t.type === 'in' && t.category === divisionName)
      .reduce((sum, t) => sum + t.amount, 0);

    // Net Available for Transfer (Allocated but not yet deposited)
    const availableToTransfer = Math.max(0, allocatedSaving - transferred);

    return {
      id: menu?.id || `ext-${divisionName}`, // Use menu ID if exists, otherwise generate one
      label: divisionName,
      balance: availableToTransfer,
      allocated: allocatedSaving,
      transferred
    };
  });

  // Calculate total available for transfer
  const totalAvailableToTransfer = divisionsBalance.reduce((sum, div) => sum + div.balance, 0);

  // Calculate saving balance
  const savingBalance = savingTransactions.reduce((sum, t) => {
    return t.type === "in" ? sum + t.amount : sum - t.amount;
  }, 0);

  // Get transfer history
  const transferHistory = savingTransactions
    .filter((t) => t.type === "in")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate saving per division (for summary display)
  const savingPerDivision = divisionsBalance.map(div => ({
    id: div.id,
    label: div.label,
    totalSaving: div.transferred,
    transferCount: savingTransactions.filter(t => t.type === "in" && t.category === div.label).length
  }));

  const handleTransferSubmit = () => {
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Masukkan jumlah yang valid!");
      return;
    }

    if (!selectedDivision) {
      alert("Pilih divisi terlebih dahulu!");
      return;
    }

    const division = divisionsBalance.find(d => d.id === selectedDivision);
    if (!division || amount > division.balance) {
      alert("Saldo divisi tidak mencukupi!");
      return;
    }

    onTransferToSaving(selectedDivision, amount);
    setTransferAmount("");
    setSelectedDivision("");
    setShowTransferModal(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const selectedDivisionData = divisionsBalance.find(d => d.id === selectedDivision);

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Available to Transfer */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Wallet size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Dana Siap Transfer</h3>
          </div>
          <p className="text-2xl font-bold text-blue-900 mb-1">
            {formatCurrency(totalAvailableToTransfer)}
          </p>
          <p className="text-xs text-blue-700">
            Dari {operationalMenus.length} divisi
          </p>
        </Card>

        {/* Saving Balance */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white">
              <PiggyBank size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Saldo Saving</h3>
          </div>
          <p className="text-2xl font-bold text-green-900 mb-1">
            {formatCurrency(savingBalance)}
          </p>
          <p className="text-xs text-green-700">
            {transferHistory.length} kali transfer
          </p>
        </Card>

        {/* Action Card */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex flex-col h-full justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Transfer ke Saving
              </h3>
              <p className="text-xs text-purple-700 mb-4">
                Amankan saldo sisa dari divisi operasional
              </p>
            </div>
            <Button
              onClick={() => setShowTransferModal(true)}
              disabled={totalAvailableToTransfer <= 0}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <ArrowRight size={16} className="mr-2" />
              Transfer Saldo
            </Button>
          </div>
        </Card>
      </div>

      {/* Total Saving Per Division */}
      <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white">
            <PiggyBank size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Total Saving per Divisi
            </h3>
            <p className="text-sm text-gray-600">
              Akumulasi tabungan dari setiap divisi operasional
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {divisionsBalance.filter(d => d.allocated > 0 || d.transferred > 0).map((division) => (
            <div
              key={division.id}
              className="p-5 bg-white rounded-xl border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900 text-lg">{division.label}</h4>
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold text-sm">
                  {division.transferred > 0 ? '\u2713' : '0'}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Terakumulasi</span>
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(division.allocated)}</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${division.allocated > 0 ? (division.transferred / division.allocated) * 100 : 0}%` }}
                    title="Sudah Ditransfer"
                  />
                  <div
                    className="bg-blue-400 h-full opacity-60"
                    style={{ width: `${division.allocated > 0 ? (division.balance / division.allocated) * 100 : 0}%` }}
                    title="Siap Ditransfer"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-gray-600 font-semibold">Siap Ditransfer:</span>
                  </div>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(division.balance)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-gray-600">Sudah Ditabung:</span>
                  </div>
                  <span className="font-semibold text-emerald-700">
                    {formatCurrency(division.transferred)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Total */}
        <div className="mt-4 pt-4 border-t-2 border-emerald-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Keseluruhan Saving</p>
              <p className="text-3xl font-bold text-emerald-700">
                {formatCurrency(savingBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Total Transfer</p>
              <p className="text-2xl font-bold text-gray-900">
                {transferHistory.length} kali
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Transfer History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Riwayat Transfer Saving
          </h3>
          <span className="text-sm text-gray-500">
            {transferHistory.length} transaksi
          </span>
        </div>

        {transferHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <PiggyBank size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada transfer ke saving</p>
            <p className="text-xs mt-1">
              Transfer saldo operasional untuk mulai menabung
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transferHistory.map((transfer) => (
              <div
                key={transfer.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <ArrowRight size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {transfer.description || "Transfer ke Saving"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {transfer.category && transfer.category !== 'Transfer' ? transfer.category : 'Transfer Operasional'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatDate(transfer.date)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(transfer.amount)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="ml-4 text-red-600 hover:bg-red-50 border-red-200"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Batalkan transfer sebesar ${formatCurrency(transfer.amount)}?`
                      )
                    ) {
                      onCancelTransfer(transfer.id);
                    }
                  }}
                >
                  <Undo2 size={16} className="mr-1" />
                  Batalkan
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4 text-white">
                <ArrowRight size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Transfer ke Saving
              </h3>
              <p className="text-sm text-gray-500">
                Pilih divisi dan masukkan jumlah yang ingin ditransfer
              </p>
            </div>

            {/* Division Selection */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Pilih Divisi
              </label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">-- Pilih Divisi --</option>
                {divisionsBalance.map((division) => (
                  <option key={division.id} value={division.id}>
                    {division.label} - {formatCurrency(division.balance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Balance Info */}
            {selectedDivisionData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Saldo Tersedia:</span>
                  <span className="font-bold text-blue-900">
                    {formatCurrency(selectedDivisionData.balance)}
                  </span>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Jumlah Transfer
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <input
                  type="number"
                  placeholder="0"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  disabled={!selectedDivision}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              {selectedDivisionData && (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setTransferAmount(Math.floor(selectedDivisionData.balance / 4).toString())
                    }
                    className="flex-1 text-xs py-1.5 px-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTransferAmount(Math.floor(selectedDivisionData.balance / 2).toString())
                    }
                    className="flex-1 text-xs py-1.5 px-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferAmount(selectedDivisionData.balance.toString())}
                    className="flex-1 text-xs py-1.5 px-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                  >
                    100%
                  </button>
                </div>
              )}
            </div>

            {/* Info Alert */}
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-6">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>
                Saldo akan dipindahkan dari divisi operasional ke saving. Anda dapat
                membatalkan transfer ini dari riwayat.
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferAmount("");
                  setSelectedDivision("");
                }}
              >
                Batal
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                onClick={handleTransferSubmit}
                disabled={!selectedDivision || !transferAmount}
              >
                <CheckCircle size={16} className="mr-2" />
                Konfirmasi Transfer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
