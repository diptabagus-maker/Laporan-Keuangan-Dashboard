import React, { useState, useEffect } from "react";
import { Card, Button, Input } from "./ui/Primitives";
import { Trash2, Edit2, Eye, EyeOff, User, Shield, Users, X, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import api from "../lib/api";

export interface UserData {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: "admin" | "user";
  createdAt: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "user" as "admin" | "user"
  });

  // Load users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.getUsers();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleOpenModal = (user?: UserData) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: user.password,
        fullName: user.fullName,
        role: user.role
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
    setShowPassword(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password || !formData.fullName) {
      alert("Semua field harus diisi!");
      return;
    }

    // Check if username already exists (except when editing)
    const usernameExists = users.some(
      u => u.username.toLowerCase() === formData.username.toLowerCase() && u.id !== editingUser?.id
    );

    if (usernameExists) {
      alert("Username sudah digunakan!");
      return;
    }

    if (editingUser) {
      // Edit logic not yet implemented in backend, but we can simulate locally or implement later
      alert("Fitur edit user melalui database belum diimplementasi sepenuhnya di backend.");
    } else {
      // Add new user via API
      const saveUser = async () => {
        try {
          const newUser = await api.createUser(formData);
          setUsers([...users, newUser]);
          setIsModalOpen(false);
        } catch (error: any) {
          console.error("Failed to create user:", error);
          alert("Gagal membuat user baru: " + error.message);
        }
      };
      saveUser();
    }
  };

  const handleOpenDeleteModal = (user: UserData) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    // Prevent deleting the last admin
    const adminCount = users.filter(u => u.role === "admin").length;
    if (deletingUser.role === "admin" && adminCount <= 1) {
      alert("Tidak dapat menghapus admin terakhir!");
      setIsDeleteModalOpen(false);
      return;
    }

    try {
      await api.deleteUser(deletingUser.id);
      setUsers(users.filter(u => u.id !== deletingUser.id));
      setIsDeleteModalOpen(false);
      setDeletingUser(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Gagal menghapus user dari database.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen User</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola akses pengguna ke sistem</p>
        </div>
        <Button onClick={() => handleOpenModal()} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Tambah User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 bg-blue-50/50 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Users className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Total User</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-purple-50/50 border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500 rounded-lg">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm text-purple-600 font-medium">Administrator</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === "admin").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-green-50/50 border-green-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 rounded-lg">
              <User className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">User Biasa</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === "user").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Nama Lengkap</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Dibuat</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.fullName}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium gap-1",
                        user.role === 'admin'
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      )}>
                        {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Edit User"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(user)}
                          className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                          title="Hapus User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Belum ada user
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Tambah User Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Username</label>
                <Input
                  placeholder="Masukkan username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                <Input
                  placeholder="Masukkan nama lengkap"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'user' })}
                    className={cn(
                      "py-2 px-4 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2",
                      formData.role === 'user'
                        ? "bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <User size={16} /> User
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={cn(
                      "py-2 px-4 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2",
                      formData.role === 'admin'
                        ? "bg-purple-50 border-purple-200 text-purple-700 ring-2 ring-purple-500/20"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <Shield size={16} /> Admin
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="flex-1">
                  {editingUser ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Hapus User?
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Apakah Anda yakin ingin menghapus user <strong>{deletingUser.username}</strong>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleConfirmDelete}
                >
                  Hapus
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
