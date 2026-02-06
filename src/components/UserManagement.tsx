import React, { useState, useEffect } from "react";
import { Card, Button, Input } from "./ui/Primitives";
import {
  Trash2,
  Edit2,
  User,
  Shield,
  Users,
  X,
  Plus,
  AlertCircle,
  RefreshCcw,
  UserPlus
} from "lucide-react";
import { cn } from "../lib/utils";
import api from "../lib/api";

export interface UserData {
  id: string;
  username: string;
  password?: string;
  fullName?: string;
  role?: "admin" | "user";
  createdAt?: string;
}

/**
 * Premium Stats Card Component
 */
const UserStatsCard = ({ title, value, icon: Icon, colorClass, delay }: any) => (
  <div
    className={cn(
      "relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group",
      delay
    )}
  >
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
      </div>
      <div className={cn("p-4 rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300", colorClass)}>
        <Icon size={24} className="text-white" />
      </div>
    </div>

    <div className="mt-4 flex items-center gap-2 relative z-10">
      <div className="h-1 w-12 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn("h-full w-full opacity-50", colorClass.split(' ')[0])}></div>
      </div>
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight italic">Sistem Terverifikasi</span>
    </div>

    {/* Abstract Background Elements */}
    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-slate-50/50 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
    <div className="absolute left-0 top-0 w-2 h-full opacity-10 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-transparent via-current to-transparent" style={{ color: 'inherit' }}></div>
  </div>
);

export const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "user" as "admin" | "user"
  });

  const fetchUsers = async () => {
    console.log("[UserManagement] Fetching users...");
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUsers();
      console.log("[UserManagement] API Data received:", data);

      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.warn("[UserManagement] Data is not an array, using empty list.");
        setUsers([]);
      }
    } catch (err: any) {
      console.error("[UserManagement] Error fetching users:", err);
      setError(err.message || "Gagal terhubung ke database. Harap cek koneksi server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user?: UserData) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username || "",
        password: user.password || "",
        fullName: user.fullName || "",
        role: user.role || "user"
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        password: "",
        fullName: "",
        role: "user"
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[UserManagement] Submitting form...", formData);
    try {
      if (editingUser) {
        alert("Edit database sedang disiapkan di backend.");
      } else {
        const newUser = await api.createUser(formData);
        console.log("[UserManagement] Created user result:", newUser);
        if (newUser) {
          setUsers(prev => [...prev, newUser]);
          setIsModalOpen(false);
        }
      }
    } catch (err: any) {
      console.error("[UserManagement] Submit error:", err);
      alert("Gagal menyimpan data: " + err.message);
    }
  };

  const handleDelete = async (user: UserData) => {
    if (!user?.id) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus akun "${user.username}"?`)) return;

    console.log("[UserManagement] Deleting user:", user.id);
    try {
      await api.deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (err: any) {
      console.error("[UserManagement] Delete error:", err);
      alert("Gagal menghapus user: " + err.message);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Format Salah";
    try {
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr.split('T')[0];
    }
  };

  // Performance guards
  const safeUsers = Array.isArray(users) ? users : [];

  if (loading && safeUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-in fade-in duration-700">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24} />
        </div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Menghubungkan ke Server...</p>
      </div>
    );
  }

  if (error && safeUsers.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-[2rem] border-2 border-slate-100 shadow-2xl max-w-lg mx-auto mt-10 animate-in zoom-in-95">
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-rose-500">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">Ups! Koneksi Terputus</h3>
        <p className="text-slate-500 mb-8 font-medium">{error}</p>
        <Button onClick={fetchUsers} className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-xl font-bold shadow-lg shadow-blue-200">
          <RefreshCcw size={18} className="mr-2" /> Coba Hubungkan Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-6 rounded-full bg-blue-600"></span>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Security Console</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Akses Pengguna</h2>
          <p className="text-slate-500 font-medium mt-3 max-w-md">
            Pusat kendali operasional untuk mengelola hak akses dan profil personil dalam sistem keuangan.
          </p>
        </div>

        <Button
          onClick={() => handleOpenModal()}
          className="group bg-slate-900 hover:bg-black text-white px-6 h-14 rounded-2xl shadow-xl transition-all hover:shadow-blue-500/20"
        >
          <UserPlus className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="font-bold">Daftarkan Akun Baru</span>
        </Button>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UserStatsCard
          title="Populasi User"
          value={safeUsers.length.toString()}
          icon={Users}
          colorClass="bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-200"
        />
        <UserStatsCard
          title="Tier Administrator"
          value={safeUsers.filter(u => u?.role === 'admin').length.toString()}
          icon={Shield}
          colorClass="bg-gradient-to-br from-purple-500 to-indigo-700 shadow-purple-200"
          delay="animate-in fade-in slide-in-from-bottom-2 duration-500"
        />
        <UserStatsCard
          title="Tier Operator"
          value={safeUsers.filter(u => u?.role !== 'admin').length.toString()}
          icon={User}
          colorClass="bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-200"
          delay="animate-in fade-in slide-in-from-bottom-4 duration-700"
        />
      </div>

      {/* Main Container */}
      <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            Daftar Personil Aktif
          </h4>
          <span className="text-[10px] font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm uppercase tracking-widest">
            {safeUsers.length} Entri Terdeteksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 text-slate-400 font-black uppercase tracking-[0.15em] text-[11px] border-b border-slate-50">
              <tr>
                <th className="px-8 py-5 text-left">Identitas User</th>
                <th className="px-8 py-5 text-left">Profil Lengkap</th>
                <th className="px-8 py-5 text-left">Level Otoritas</th>
                <th className="px-8 py-5 text-left">Data Registrasi</th>
                <th className="px-8 py-5 text-right">Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {safeUsers.length > 0 ? (
                safeUsers.map((user, idx) => (
                  <tr key={user?.id || `user-${idx}`} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-black text-slate-600 text-lg group-hover:from-blue-100 group-hover:to-blue-200 group-hover:text-blue-600 transition-all duration-300">
                          {(user?.username || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-base leading-none mb-1 group-hover:text-blue-700 transition-colors">{user?.username || "---"}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {user?.id?.substring(0, 8) || "TEMP"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-slate-600 font-bold italic">{user?.fullName || "Belum Diatur"}</td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] gap-2 border shadow-sm",
                        user?.role === 'admin'
                          ? "bg-purple-50 text-purple-700 border-purple-100"
                          : "bg-blue-50 text-blue-700 border-blue-100"
                      )}>
                        {user?.role === 'admin' ? <Shield size={12} strokeWidth={3} /> : <User size={12} strokeWidth={3} />}
                        {user?.role || "user"}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-slate-400 font-bold text-xs">
                      {formatDate(user?.createdAt)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                          title="Perbarui Data"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                          title="Hapus Permanen"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
                        <Users size={40} />
                      </div>
                      <div>
                        <p className="text-slate-800 font-black">Database Masih Kosong</p>
                        <p className="text-slate-400 text-xs font-medium mt-1">Belum ada personil yang terdaftar dalam sistem otomasi saat ini.</p>
                      </div>
                      <Button onClick={() => handleOpenModal()} size="sm" variant="secondary" className="rounded-xl border-slate-200">
                        Klik Untuk Menambah
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Premium Glassmorphism Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-md overflow-hidden bg-white shadow-3xl rounded-[2.5rem] border-0 animate-in zoom-in-95 duration-500">
            <div className="p-8 pb-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Registration Form</p>
                <h3 className="text-2xl font-black tracking-tight">{editingUser ? "Modifikasi Profil" : "Registrasi Akun Baru"}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="relative z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white">
                <X size={20} />
              </button>
              {/* Decorative circle */}
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username Unik</label>
                <Input
                  placeholder="Masukkan username..."
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-bold transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap Sesuai Dokumen</label>
                <Input
                  placeholder="Masukkan nama lengkap..."
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-bold transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kredensial Keamanan</label>
                <Input
                  type="password"
                  placeholder="Buat sandi yang kuat..."
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-bold transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Level Otorisasi</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'user' })}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all group",
                      formData.role === 'user'
                        ? "bg-blue-50 border-blue-600 shadow-lg shadow-blue-100"
                        : "bg-slate-50 border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <User size={20} className={formData.role === 'user' ? "text-blue-600" : "text-slate-400"} strokeWidth={3} />
                    <span className={cn("text-xs font-black uppercase tracking-widest", formData.role === 'user' ? "text-blue-700" : "text-slate-500")}>Reguler</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all group",
                      formData.role === 'admin'
                        ? "bg-purple-50 border-purple-600 shadow-lg shadow-purple-100"
                        : "bg-slate-50 border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <Shield size={20} className={formData.role === 'admin' ? "text-purple-600" : "text-slate-400"} strokeWidth={3} />
                    <span className={cn("text-xs font-black uppercase tracking-widest", formData.role === 'admin' ? "text-purple-700" : "text-slate-500")}>Admin</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs border-slate-200"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 transition-all hover:scale-[1.02]"
                >
                  Simpan Konfigurasi
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
