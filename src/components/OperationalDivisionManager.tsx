import React, { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Download,
    FileText,
    Trash2,
    Edit2,
    MoreVertical,
    Calendar,
    Tag,
    PlusCircle,
    X,
    CheckCircle,
    FileUp,
    Image as ImageIcon,
    Check,
    Upload,
    Settings,
    Loader2,
    PiggyBank,
    Wallet
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Card } from "./ui/Primitives";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Transaction } from "./TransactionManager";
import { MenuItem } from "./Sidebar";
import { cn } from "../lib/utils";
import api, { DivisionSetting } from "../lib/api";

interface OperationalDivisionManagerProps {
    data: Transaction[];
    onAdd: (t: Transaction) => void;
    onEdit: (t: Transaction) => void;
    onDelete: (id: string) => void;
    onTransfer: (name: string, amount: number) => void;
    operationalMenus: MenuItem[];
}


export const OperationalDivisionManager = ({
    data,
    onAdd,
    onEdit,
    onDelete,
    onTransfer,
    operationalMenus
}: OperationalDivisionManagerProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [divisionSettings, setDivisionSettings] = useState<DivisionSetting[]>([]);
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);

    const [editingItem, setEditingItem] = useState<Transaction | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));

    const [formData, setFormData] = useState<Partial<Transaction>>({
        date: format(new Date(), 'yyyy-MM-dd'),
        description: "",
        type: "out",
        amount: 0,
        category: "",
    });

    // Fetch Division Settings
    const fetchSettings = async () => {
        setIsSettingsLoading(true);
        try {
            const settings = await api.getDivisionSettings();
            setDivisionSettings(settings);
            if (settings.length > 0 && !formData.category) {
                setFormData(prev => ({
                    ...prev,
                    category: settings[0].name,
                    amount: Number(settings[0].nominal)
                }));
            }
        } catch (error) {
            console.error("Failed to fetch division settings:", error);
        } finally {
            setIsSettingsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    // settings form state
    const [settFormData, setSettFormData] = useState<Partial<DivisionSetting>>({ name: '', nominal: 0 });
    const [editingSett, setEditingSett] = useState<DivisionSetting | null>(null);

    const handleSaveSetting = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSett) {
                await api.updateDivisionSetting(editingSett.id, settFormData);
            } else {
                await api.createDivisionSetting({
                    ...settFormData,
                    display_order: divisionSettings.length + 1
                });
            }
            setSettFormData({ name: '', nominal: 0 });
            setEditingSett(null);
            fetchSettings();
        } catch (error) {
            alert("Gagal menyimpan pengaturan divisi");
        }
    };

    const handleDeleteSetting = async (id: string) => {
        if (confirm("Hapus divisi ini? Data transaksi yang sudah ada tidak akan hilang tapi tidak akan muncul lagi di ceklist bulanan.")) {
            try {
                await api.deleteDivisionSetting(id);
                fetchSettings();
            } catch (error) {
                alert("Gagal menghapus divisi");
            }
        }
    };

    const filteredData = data.filter(item => {
        const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMonth = item.date.startsWith(filterMonth);
        return matchesSearch && matchesMonth;
    });

    const handleOpenAdd = () => {
        const defaultDiv = divisionSettings.length > 0 ? divisionSettings[0] : null;
        setEditingItem(null);
        setFormData({
            date: format(new Date(), 'yyyy-MM-dd'),
            description: "",
            type: "out",
            amount: defaultDiv ? Number(defaultDiv.nominal) : 0,
            category: defaultDiv ? defaultDiv.name : "",
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: Transaction) => {
        setEditingItem(item);
        setFormData(item);
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            onEdit({ ...editingItem, ...formData } as Transaction);
        } else {
            onAdd({ ...formData, id: Math.random().toString(36).substr(2, 9) } as Transaction);
        }
        setIsModalOpen(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, proof_image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTransfer = (name: string, amount: number) => {
        if (confirm(`Alihkan dana ${name} sebesar Rp ${formatCurrency(amount).replace('Rp', '').trim()} ke Dana Taktis?`)) {
            onTransfer(name, amount);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const openProof = (base64Data: string) => {
        try {
            if (base64Data.startsWith('data:application/pdf')) {
                const win = window.open();
                if (win) {
                    win.document.write(`<iframe src="${base64Data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                }
            } else {
                const win = window.open();
                if (win) {
                    win.document.write(`<img src="${base64Data}" style="max-width:100%; height:auto;" />`);
                }
            }
        } catch (error) {
            console.error("Error opening proof:", error);
            window.open(base64Data, '_blank');
        }
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredData.map(item => ({
            Tanggal: item.date,
            Divisi: item.category,
            Keterangan: item.description,
            Jumlah: item.amount,
            Status: item.proof_image ? 'Ada Bukti' : 'Belum Ada Bukti'
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Operasional Divisi");
        XLSX.writeFile(wb, `operasional_divisi_${filterMonth}.xlsx`);
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">Status Pengiriman Dana</h2>
                    <Input
                        type="month"
                        className="w-full md:w-44 bg-white border-slate-200"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="gap-2 text-slate-600 border-slate-200 bg-white"
                        onClick={() => setIsSettingsModalOpen(true)}
                    >
                        <Settings size={18} />
                        <span>Pengaturan</span>
                    </Button>
                    <Button variant="outline" className="gap-2 text-slate-600 border-slate-200 bg-white" onClick={exportToExcel}>
                        <Download size={18} />
                        <span>Ekspor Laporan</span>
                    </Button>
                </div>
            </div>

            {/* Checklist Table */}
            <Card className="overflow-hidden border-slate-200 shadow-sm bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="px-6 py-4 text-sm font-bold text-slate-800 tracking-wide">Divisi</th>
                                <th className="px-6 py-4 text-sm font-bold text-slate-800 tracking-wide text-right">Nominal</th>
                                <th className="px-6 py-4 text-sm font-bold text-slate-800 tracking-wide text-center">Bukti</th>
                                <th className="px-6 py-4 text-sm font-bold text-slate-800 tracking-wide text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isSettingsLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Loader2 size={24} className="animate-spin" />
                                            <span>Memuat konfigurasi divisi...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : divisionSettings.length > 0 ? (
                                divisionSettings.map((setting) => {
                                    const divisionName = setting.name;
                                    const item = filteredData.find(d => d.category === divisionName);
                                    const fixedAmount = Number(setting.nominal);

                                    return (
                                        <tr key={setting.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900">{divisionName}</div>
                                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <Calendar size={12} />
                                                    {format(new Date(filterMonth + '-01'), 'MMMM yyyy', { locale: id })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className={cn(
                                                    "text-base font-bold",
                                                    item ? "text-slate-900" : "text-slate-400"
                                                )}>
                                                    Rp {formatCurrency(item?.amount || fixedAmount).replace('Rp', '').trim()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item && item.proof_image ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <button
                                                            onClick={() => openProof(item.proof_image!)}
                                                            className="inline-flex items-center justify-center p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shadow-sm"
                                                            title="Lihat Bukti"
                                                        >
                                                            <Check size={20} className="stroke-[3]" />
                                                        </button>
                                                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Sudah</span>
                                                    </div>
                                                ) : item ? (
                                                    <div className="flex flex-col items-center gap-1 animate-in fade-in zoom-in duration-300">
                                                        <div
                                                            className="inline-flex items-center justify-center p-2 rounded-lg bg-purple-50 text-purple-600 shadow-sm border border-purple-100"
                                                            title={item.description}
                                                        >
                                                            <Wallet size={20} className="stroke-[3]" />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-tighter">Dana Taktis</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const defaultDate = filterMonth === format(new Date(), 'yyyy-MM')
                                                                    ? format(new Date(), 'yyyy-MM-dd')
                                                                    : `${filterMonth}-01`;
                                                                setEditingItem(null);
                                                                setFormData({
                                                                    date: defaultDate,
                                                                    description: "",
                                                                    type: "out",
                                                                    amount: fixedAmount,
                                                                    category: divisionName,
                                                                });
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="inline-flex flex-col items-center gap-1 group"
                                                        >
                                                            <div className="p-2 rounded-lg bg-slate-50 text-slate-400 border border-dashed border-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 group-hover:border-blue-400 transition-all">
                                                                <Upload size={18} />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500 uppercase">Input</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleTransfer(divisionName, fixedAmount)}
                                                            className="inline-flex flex-col items-center gap-1 group"
                                                            title="Alihkan ke Dana Taktis"
                                                        >
                                                            <div className="p-2 rounded-lg bg-slate-50 text-slate-400 border border-dashed border-slate-300 group-hover:bg-purple-50 group-hover:text-purple-600 group-hover:border-purple-300 transition-all">
                                                                <Wallet size={18} />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-purple-600 uppercase">Dana Taktis</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {item ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleOpenEdit(item)}
                                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => onDelete(item.id)}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold"
                                                            onClick={() => {
                                                                const defaultDate = filterMonth === format(new Date(), 'yyyy-MM')
                                                                    ? format(new Date(), 'yyyy-MM-dd')
                                                                    : `${filterMonth}-01`;
                                                                setEditingItem(null);
                                                                setFormData({
                                                                    date: defaultDate,
                                                                    description: "",
                                                                    type: "out",
                                                                    amount: fixedAmount,
                                                                    category: divisionName,
                                                                });
                                                                setIsModalOpen(true);
                                                            }}
                                                        >
                                                            Lengkapi
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        Tidak ada divisi yang terdaftar. Silakan atur di menu Pengaturan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingItem ? "Edit Data Operasional" : "Tambah Data Operasional"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Tanggal</label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Nominal (Rp)</label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Divisi</label>
                                <select
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.category}
                                    onChange={(e) => {
                                        const newDivName = e.target.value;
                                        const setting = divisionSettings.find(s => s.name === newDivName);
                                        setFormData({
                                            ...formData,
                                            category: newDivName,
                                            amount: setting ? Number(setting.nominal) : formData.amount
                                        });
                                    }}
                                    required
                                >
                                    <option value="" disabled>Pilih Divisi...</option>
                                    {divisionSettings.map(s => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </div>



                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    <FileUp size={16} className="text-blue-500" />
                                    Upload Bukti Transaksi
                                </label>
                                <div className="relative group/upload">
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="proof-upload-ops"
                                    />
                                    <label
                                        htmlFor="proof-upload-ops"
                                        className="flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all p-4"
                                    >
                                        {formData.proof_image ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                                    {formData.proof_image.startsWith('data:application/pdf') ? <FileText size={24} /> : <ImageIcon size={24} />}
                                                </div>
                                                <span className="text-xs font-semibold text-emerald-600 text-center">Bukti Terpilih (Ganti?)</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="p-2 rounded-lg bg-slate-100 text-slate-400 group-hover/upload:bg-blue-100 group-hover/upload:text-blue-600 transition-colors">
                                                    <FileUp size={20} />
                                                </div>
                                                <span className="text-xs text-slate-500">Klik untuk upload bukti</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/10"
                                >
                                    {editingItem ? "Update" : "Simpan"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Division Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Pengaturan Divisi</h3>
                                <p className="text-xs text-slate-500">Kelola daftar divisi dan nominal bantuan bulanan</p>
                            </div>
                            <button
                                onClick={() => setIsSettingsModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Form Section */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{editingSett ? 'Edit Divisi' : 'Tambah Divisi Baru'}</h4>
                                <form onSubmit={handleSaveSetting} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600">Nama Divisi</label>
                                        <Input
                                            placeholder="Contoh: Infrastruktur Jaringan"
                                            value={settFormData.name}
                                            onChange={(e) => setSettFormData({ ...settFormData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600">Nominal Bulanan (Rp)</label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={settFormData.nominal}
                                            onChange={(e) => setSettFormData({ ...settFormData, nominal: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                                            {editingSett ? 'Update' : 'Simpan'}
                                        </Button>
                                        {editingSett && (
                                            <Button type="button" variant="outline" onClick={() => {
                                                setEditingSett(null);
                                                setSettFormData({ name: '', nominal: 0 });
                                            }}>Batal</Button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* List Section */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Daftar Divisi</h4>
                                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                                    {divisionSettings.map((s) => (
                                        <div key={s.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between group">
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{s.name}</div>
                                                <div className="text-xs text-blue-600 font-medium">Rp {formatCurrency(Number(s.nominal)).replace('Rp', '').trim()}</div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingSett(s);
                                                        setSettFormData({ name: s.name, nominal: Number(s.nominal) });
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSetting(s.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {divisionSettings.length === 0 && (
                                        <div className="text-center py-8 text-slate-400 text-sm italic">Belum ada divisi</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <Button onClick={() => setIsSettingsModalOpen(false)}>Selesai</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
