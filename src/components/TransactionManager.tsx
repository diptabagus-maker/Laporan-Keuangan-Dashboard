import React, { useState, useMemo } from "react";
import { Card, Button, Input, Select } from "./ui/Primitives";
import { Plus, Trash2, Edit2, FileDown, Search, Filter, PiggyBank, Calendar, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "../lib/utils";

export interface Transaction {
  id: string;
  menu_id?: string;
  user_id?: string;
  date: string;
  description: string;
  type: "in" | "out";
  amount: number;
  category: string;
  proof_image?: string; // Base64 or URL
}

interface TransactionManagerProps {
  title: string;
  data: Transaction[];
  onAdd: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  categories: string[];
  isSavings?: boolean;
  isOperational?: boolean; // New prop
}

export const TransactionManager = ({
  title,
  data,
  onAdd,
  onEdit,
  onDelete,
  categories,
  isSavings = false,
  isOperational = false // Default to false
}: TransactionManagerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");
  // Default to current month (Local Time)
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Form State
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toLocaleDateString('en-CA'),
    type: "out",
    amount: 0,
    description: "",
    category: categories[0]
  });

  const handleOpenModal = (item?: Transaction) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString('en-CA'),
        type: "out",
        amount: 0,
        description: "",
        category: categories[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    const transaction: Transaction = {
      id: editingItem?.id || crypto.randomUUID(),
      date: formData.date!,
      description: formData.description!,
      type: formData.type as "in" | "out",
      amount: Number(formData.amount),
      category: formData.category || "General",
      proof_image: formData.proof_image
    };

    if (editingItem) {
      onEdit(transaction);
    } else {
      onAdd(transaction);
    }
    setIsModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, proof_image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleViewProof = (base64Data: string) => {
    try {
      // Split the base64 string to get the content type and the data
      const parts = base64Data.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);

      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }

      const blob = new Blob([uInt8Array], { type: contentType });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Clean up the URL after some time to avoid memory leaks
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error("Error opening image:", error);
      // Fallback: try opening directly if it's not a long data URL
      window.open(base64Data, '_blank');
    }
  };

  const exportToExcel = () => {
    const mainData = filteredData.map(item => ({
      Tanggal: item.date,
      Keterangan: item.description,
      Tipe: item.type === 'in' ? 'Masuk' : 'Keluar',
      Kategori: item.category,
      Jumlah: item.amount
    }));

    const summaryData = [
      { Tanggal: "", Keterangan: "", Tipe: "", Kategori: "", Jumlah: "" }, // Spacer
      { Tanggal: "RINGKASAN SALDO", Keterangan: "", Tipe: "", Kategori: "", Jumlah: "" },
      { Tanggal: "Saldo Awal", Keterangan: "", Tipe: "", Kategori: "", Jumlah: beginningBalance },
      { Tanggal: "Total Pemasukan", Keterangan: "", Tipe: "", Kategori: "", Jumlah: currentIncome },
      { Tanggal: "Total Pengeluaran", Keterangan: "", Tipe: "", Kategori: "", Jumlah: currentExpense },
      { Tanggal: "Saldo Akhir", Keterangan: "", Tipe: "", Kategori: "", Jumlah: endingBalance },
    ];

    const ws = XLSX.utils.json_to_sheet([...mainData, ...summaryData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s/g, '_')}_report.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Laporan ${title}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Bulan: ${currentMonthName}`, 14, 22);

    const tableData = filteredData.map(row => [
      row.date,
      row.description,
      row.type === 'in' ? 'Masuk' : 'Keluar',
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(row.amount)
    ]);

    autoTable(doc, {
      head: [['Tanggal', 'Keterangan', 'Tipe', 'Jumlah']],
      body: tableData,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Summary Box
    doc.setFontSize(10);
    doc.text("RINGKASAN SALDO", 14, finalY);

    autoTable(doc, {
      body: [
        ['Saldo Awal', formatRupiah(beginningBalance)],
        ['Total Pemasukan', formatRupiah(currentIncome)],
        ['Total Pengeluaran', formatRupiah(currentExpense)],
        ['Saldo Akhir', formatRupiah(endingBalance)],
      ],
      startY: finalY + 5,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    doc.save(`${title.toLowerCase().replace(/\s/g, '_')}_report.pdf`);
  };

  const exportToHTML = () => {
    const tableRows = filteredData.map(item => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.date}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.description}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.type === 'in' ? 'Masuk' : 'Keluar'}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.amount)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${item.category}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan ${title}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; max-width: 1000px; margin: 0 auto; }
          .header { margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f8f9fa; border: 1px solid #ddd; padding: 12px; text-align: left; }
          .summary-card { margin-top: 30px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; width: 300px; margin-left: auto; }
          .summary-item { display: flex; justify-content: space-between; padding: 5px 0; }
          .total-line { border-top: 1px solid #e2e8f0; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 1.1em; color: #1e40af; }
          .income { color: #16a34a; }
          .expense { color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Laporan ${title}</h2>
          <p>Bulan: ${currentMonthName}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Keterangan</th>
              <th>Tipe</th>
              <th>Jumlah</th>
              <th>Kategori</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="5" style="text-align:center; padding: 20px;">Tidak ada data</td></tr>'}
          </tbody>
        </table>

        <div class="summary-card">
          <h3 style="margin-top: 0; font-size: 1rem; color: #64748b;">RINGKASAN SALDO</h3>
          <div class="summary-item">
            <span>Saldo Awal:</span>
            <span>${formatRupiah(beginningBalance)}</span>
          </div>
          <div class="summary-item income">
            <span>Total Pemasukan:</span>
            <span>+${formatRupiah(currentIncome)}</span>
          </div>
          <div class="summary-item expense">
            <span>Total Pengeluaran:</span>
            <span>-${formatRupiah(currentExpense)}</span>
          </div>
          <div class="summary-item total-line">
            <span>Saldo Akhir:</span>
            <span>${formatRupiah(endingBalance)}</span>
          </div>
        </div>
        
        <div style="margin-top: 50px; text-align: center; color: #94a3b8; font-size: 0.8rem;">
          Dicetak pada: ${new Date().toLocaleString('id-ID')}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s/g, '_')}_report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesMonth = !filterMonth || (item.date && String(item.date).substring(0, 7) === filterMonth);
    return matchesSearch && matchesType && matchesMonth;
  });

  // Calculate Balances
  const startOfMonth = filterMonth ? `${filterMonth}-01` : "";

  // Saldo awal bulan = akumulasi SEMUA transaksi SEBELUM bulan yang difilter
  // Ini adalah carry forward dari bulan-bulan sebelumnya
  const beginningBalance = useMemo(() => {
    if (!startOfMonth) return 0;
    return data
      .filter(t => t.date < startOfMonth)
      .reduce((acc, t) => acc + (t.type === 'in' ? t.amount : -t.amount), 0);
  }, [data, startOfMonth]);

  // Pemasukan bulan ini (hanya dari data yang sudah difilter)
  const currentIncome = useMemo(() =>
    filteredData
      .filter(t => t.type === 'in')
      .reduce((acc, t) => acc + t.amount, 0),
    [filteredData]);

  // Pengeluaran bulan ini (hanya dari data yang sudah difilter)
  const currentExpense = useMemo(() =>
    filteredData
      .filter(t => t.type === 'out')
      .reduce((acc, t) => acc + t.amount, 0),
    [filteredData]);

  // Saldo akhir bulan = saldo awal + pemasukan - pengeluaran
  // Saldo ini akan menjadi saldo awal bulan berikutnya
  const endingBalance = beginningBalance + currentIncome - currentExpense;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const currentMonthName = useMemo(() => {
    if (!filterMonth) return "";
    const parts = filterMonth.split('-');
    if (parts.length !== 2) return "";
    // Create local date to avoid timezone shifts
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    return date.toLocaleString('id-ID', { month: 'long' });
  }, [filterMonth]);

  const prevMonthName = useMemo(() => {
    if (!filterMonth) return "";
    const parts = filterMonth.split('-');
    if (parts.length !== 2) return "";
    // Create local date
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    date.setMonth(date.getMonth() - 1);
    return date.toLocaleString('id-ID', { month: 'long' });
  }, [filterMonth]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportToExcel} size="sm">
            <FileDown className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="secondary" onClick={exportToPDF} size="sm">
            <FileDown className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button variant="secondary" onClick={exportToHTML} size="sm">
            <FileDown className="mr-2 h-4 w-4" /> HTML
          </Button>
          <Button onClick={() => handleOpenModal()} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Tambah Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={cn(
        "grid grid-cols-1 gap-4",
        filterMonth ? "sm:grid-cols-2 lg:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-4"
      )}>
        {filterMonth && (
          <Card className="p-4 bg-slate-50/50 border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Calendar size={48} className="text-slate-600" />
            </div>
            <div className="relative z-10">
              <div className="text-sm font-medium text-slate-600 mb-1">
                Saldo Akhir {prevMonthName}
              </div>
              <div className="text-xl font-bold text-gray-700">
                {formatRupiah(beginningBalance)}
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4 bg-blue-50/50 border-blue-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Calendar size={48} className="text-blue-600" />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-medium text-blue-600 mb-1">
              {filterMonth ? `Saldo Awal ${currentMonthName}` : 'Saldo Awal'}
            </div>
            <div className="text-xl font-bold text-gray-900">
              {formatRupiah(beginningBalance)}
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-green-50/50 border-green-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Plus size={48} className="text-green-600" />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-medium text-green-600 mb-1">
              Pemasukan
            </div>
            <div className="text-xl font-bold text-green-700">
              +{formatRupiah(currentIncome)}
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-red-50/50 border-red-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Trash2 size={48} className="text-red-600" />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-medium text-red-600 mb-1">
              Pengeluaran
            </div>
            <div className="text-xl font-bold text-red-700">
              -{formatRupiah(currentExpense)}
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gray-50/50 border-gray-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <PiggyBank size={48} className="text-gray-600" />
          </div>
          <div className="relative z-10">
            <div className="text-sm font-medium text-gray-600 mb-1">
              {filterMonth ? `Saldo Akhir ${currentMonthName}` : 'Saldo Akhir'}
            </div>
            <div className={cn(
              "text-xl font-bold",
              endingBalance >= 0 ? "text-gray-900" : "text-red-600"
            )}>
              {formatRupiah(endingBalance)}
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari transaksi..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full md:w-auto flex gap-2">
            <Select
              value={filterMonth.split('-')[1]}
              onChange={(e) => {
                const year = filterMonth.split('-')[0];
                setFilterMonth(`${year}-${e.target.value}`);
              }}
              className="w-32"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const monthNum = String(i + 1).padStart(2, '0');
                const monthName = new Date(2000, i, 1).toLocaleString('id-ID', { month: 'long' });
                return <option key={monthNum} value={monthNum}>{monthName}</option>;
              })}
            </Select>
            <Select
              value={filterMonth.split('-')[0]}
              onChange={(e) => {
                const month = filterMonth.split('-')[1];
                setFilterMonth(`${e.target.value}-${month}`);
              }}
              className="w-24"
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - 5 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="all">Semua Tipe</option>
              <option value="in">Pemasukan</option>
              <option value="out">Pengeluaran</option>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Tanggal</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3 text-right">Jumlah</th>
                {isSavings && <th className="px-4 py-3">Bukti</th>}
                <th className={cn("px-4 py-3 text-right", !isSavings && "rounded-tr-lg")}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{item.date}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.description}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium",
                        item.type === 'in' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {item.type === 'in' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className={cn(
                      "px-4 py-3 text-right font-medium",
                      item.type === 'in' ? "text-green-600" : "text-red-600"
                    )}>
                      {item.type === 'in' ? '+' : '-'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.amount)}
                    </td>
                    {isSavings && (
                      <td className="px-4 py-3">
                        {item.proof_image ? (
                          <button
                            onClick={() => item.proof_image && handleViewProof(item.proof_image)}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                          >
                            Lihat Bukti
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No image</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        {item.category === 'Saving' && (
                          <span
                            className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full mr-2"
                            title="Transaksi Saving"
                          >
                            <PiggyBank size={12} /> Saving
                          </span>
                        )}
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isSavings ? 6 : 5} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada data ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Edit Transaksi' : 'Tambah Transaksi'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'in' })}
                    className={cn(
                      "py-2 px-4 rounded-lg border text-sm font-medium transition-all",
                      formData.type === 'in'
                        ? "bg-green-50 border-green-200 text-green-700 ring-2 ring-green-500/20"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'out' })}
                    className={cn(
                      "py-2 px-4 rounded-lg border text-sm font-medium transition-all",
                      formData.type === 'out'
                        ? "bg-red-50 border-red-200 text-red-700 ring-2 ring-red-500/20"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    Pengeluaran
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tanggal</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Keterangan</label>
                <Input
                  placeholder="Contoh: Gaji Bulanan, Beli Alat Tulis"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Jumlah (Rp)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                />
              </div>

              {isOperational && formData.type === 'out' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is-saving"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={formData.category === 'Saving'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.checked ? 'Saving' : (categories[0] || 'Umum') })}
                  />
                  <label htmlFor="is-saving" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                    Simpan sebagai Saving (Dana Siapp Transfer)
                  </label>
                </div>
              )}

              {/* Bukti Transaksi Upload - Only for Savings Out Transactions */}
              {isSavings && (
                <div className="space-y-1 pt-2 border-t border-gray-100">
                  <label className="text-sm font-medium text-gray-700">Bukti Transaksi (Opsional)</label>
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.proof_image && (
                    <div className="mt-2 relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                      {formData.proof_image.startsWith('data:application/pdf') ? (
                        <div className="flex flex-col items-center gap-2">
                          <FileText size={48} className="text-red-500" />
                          <span className="text-xs font-medium text-gray-600">Dokumen PDF Terlampir</span>
                        </div>
                      ) : (
                        <img
                          src={formData.proof_image}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, proof_image: undefined })}
                        className="absolute top-1 right-1 p-1 bg-white rounded-full shadow hover:bg-red-50 text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="flex-1">
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple X icon for modal
const X = ({ className, size }: { className?: string; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="M6 6 18 18" />
  </svg>
);