import React, { useState, useEffect } from "react";
import { Sidebar, ViewType, MenuItem, Section } from "./components/Sidebar";
import { DashboardHome } from "./components/DashboardHome";
import { TransactionManager, Transaction } from "./components/TransactionManager";
import { Login } from "./components/Login";
import { DataSettings } from "./components/DataSettings";
import { OperationalSavingUnified } from "./components/OperationalSavingUnified";
import { UserManagement } from "./components/UserManagement";
import { OperationalDivisionManager } from "./components/OperationalDivisionManager";
import { SavingsSummaryHeader } from "./components/SavingsSummaryHeader";
import { ExportModal } from "./components/ExportModal";
import { Menu, Monitor, Server, PiggyBank, Layers, X, AlertTriangle, Cpu, Database, Landmark, Coins, Briefcase } from "lucide-react";
import { Button, Input, Select, Card } from "./components/ui/Primitives";
import api from "./lib/api"; // Import API service

// Icon mapping for serialization
const iconMap: Record<string, any> = {
  'Monitor': Monitor,
  'Server': Server,
  'PiggyBank': PiggyBank,
  'Layers': Layers,
  'Cpu': Cpu,
  'Database': Database,
  'Landmark': Landmark,
  'Coins': Coins,
  'Briefcase': Briefcase,
};

// Helper to restore icons
const restoreMenuIcons = (menus: any[]): MenuItem[] => {
  return menus.map(menu => {
    if (menu.icon && typeof menu.icon === 'function') return menu;
    const iconName = menu.icon_name || (typeof menu.icon === 'string' ? menu.icon : 'Briefcase');
    return { ...menu, icon: iconMap[iconName] || Briefcase };
  });
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Menus and Sections State
  const [operationalMenus, setOperationalMenus] = useState<MenuItem[]>([]);
  const [savingsMenus, setSavingsMenus] = useState<MenuItem[]>([]);
  const [customSections, setCustomSections] = useState<Section[]>([]);
  const [transactions, setTransactions] = useState<Record<string, Transaction[]>>({});

  // Auth check
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // Fetch Initial Data
  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          const [sectionsData, menusData] = await Promise.all([
            api.getSections(),
            api.getMenus()
          ]);

          const restoredMenus = restoreMenuIcons(menusData);
          setOperationalMenus(restoredMenus.filter(m => m.type === 'operational'));
          setSavingsMenus(restoredMenus.filter(m => m.type === 'savings'));

          // Organize sections
          const sectionsWithItems = sectionsData.map((s: any) => ({
            ...s,
            items: restoredMenus.filter(m => m.section_id === s.id)
          }));
          setCustomSections(sectionsWithItems);

          // Fetch transactions for visible menus
          const allMenuIds = restoredMenus.map(m => m.id);
          const txPromises = allMenuIds.map(id => api.getTransactions(id));
          const txResults = await Promise.all(txPromises);

          const txMap: Record<string, Transaction[]> = {};
          allMenuIds.forEach((id, index) => {
            txMap[id] = (txResults[index] || [])
              .map(t => ({
                ...t,
                amount: Number(t.amount)
              }))
              .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          });
          setTransactions(txMap);

        } catch (error) {
          console.error("Failed to fetch data:", error);
        }
      };
      fetchData();
    }
  }, [isAuthenticated]);

  // Handler Refactors
  const handleAddTransaction = async (viewId: string, t: any) => {
    try {
      const currentUserId = localStorage.getItem("userId") || '1';
      const newTx = await api.createTransaction({ ...t, menu_id: viewId, user_id: currentUserId });
      setTransactions(prev => {
        const updated = [newTx, ...(prev[viewId] || [])];
        return {
          ...prev,
          [viewId]: updated.sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        };
      });
    } catch (error: any) {
      console.error("Failed to add transaction:", error);
      alert("Gagal menambah transaksi: " + error.message);
    }
  };

  const handleEditTransaction = async (viewId: string, t: Transaction) => {
    try {
      await api.updateTransaction(t.id, t);
      setTransactions(prev => ({
        ...prev,
        [viewId]: (prev[viewId] || []).map(item => item.id === t.id ? t : item)
      }));
    } catch (error: any) {
      console.error("Failed to edit transaction:", error);
      alert("Gagal mengedit transaksi: " + error.message);
    }
  };

  const handleDeleteTransaction = async (viewId: string, id: string) => {
    try {
      // Get transaction details before deleting
      const txToDelete = (transactions[viewId] || []).find(t => t.id === id);

      await api.deleteTransaction(id);

      // Initial state update for the deleted item
      setTransactions(prev => ({
        ...prev,
        [viewId]: (prev[viewId] || []).filter(item => item.id !== id)
      }));

      // Check if this was a transfer that needs distinct cleanup (Dana Taktis / Saving)
      if (txToDelete && (viewId === 'operational_taktis' || viewId === 'operational_saving')) {
        // Look for counterpart in operational_division
        // Criteria: same amount, same date, same category, description indicates transfer
        const divisionData = transactions['operational_division'] || [];
        const counterpart = divisionData.find(d =>
          d.amount === txToDelete.amount &&
          d.date === txToDelete.date &&
          d.category === txToDelete.category &&
          (d.description.includes('Dialihkan ke') || d.description.includes('Saving') || d.description.includes('Dana Taktis'))
        );

        if (counterpart) {
          console.log(`Deleting counterpart transaction: ${counterpart.id}`);
          await api.deleteTransaction(String(counterpart.id));

          setTransactions(prev => ({
            ...prev,
            'operational_division': (prev['operational_division'] || []).filter(item => item.id !== counterpart.id)
          }));
        }
      }

    } catch (error: any) {
      console.error("Failed to delete transaction:", error);
      alert("Gagal menghapus transaksi: " + error.message);
    }
  };

  // Modal & Edit States
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renamingMenuId, setRenamingMenuId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMenu, setDeletingMenu] = useState<{ id: string, label: string, isSection?: boolean } | null>(null);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const [newMenuData, setNewMenuData] = useState({ label: '', type: 'operational' });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Auth Handlers
  const handleLogin = () => {
    localStorage.setItem("isAuthenticated", "true");
    setIsAuthenticated(true);
  };
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionLabel) return;
    try {
      const currentUserId = localStorage.getItem("userId") || '1';
      const newSection = await api.createSection({ label: newSectionLabel, user_id: currentUserId });
      setCustomSections([...customSections, { ...newSection, items: [] }]);
      setIsAddSectionOpen(false);
      setNewSectionLabel("");
    } catch (error) {
      console.error("Failed to create section:", error);
    }
  };

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuData.label) return;
    try {
      const isCustomSection = !['operational', 'savings'].includes(newMenuData.type);
      const newMenu = await api.createMenu({
        label: newMenuData.label,
        type: isCustomSection ? 'custom' : newMenuData.type,
        icon_name: newMenuData.type === 'operational' ? 'Briefcase' : (newMenuData.type === 'savings' ? 'Coins' : 'Layers'),
        section_id: isCustomSection ? newMenuData.type : undefined,
        user_id: localStorage.getItem("userId") || '1'
      });

      const restoredMenu = restoreMenuIcons([newMenu])[0];

      if (newMenuData.type === 'operational') {
        setOperationalMenus([...operationalMenus, restoredMenu]);
      } else if (newMenuData.type === 'savings') {
        setSavingsMenus([...savingsMenus, restoredMenu]);
      } else {
        setCustomSections(prev => prev.map(section =>
          section.id === newMenuData.type
            ? { ...section, items: [...section.items, restoredMenu] }
            : section
        ));
      }

      setTransactions(prev => ({ ...prev, [restoredMenu.id]: [] }));
      setIsAddMenuOpen(false);
      setNewMenuData({ label: '', type: 'operational' });
      setCurrentView(restoredMenu.id);
    } catch (error: any) {
      console.error("Failed to create menu:", error);
      alert("Gagal membuat menu: " + error.message);
    }
  };

  // Aggregate Data for Dashboard
  const getMenuLabel = (id: string) => {
    const allMenus = [
      ...operationalMenus,
      ...savingsMenus,
      ...customSections.flatMap(s => s.items)
    ];
    return allMenus.find(m => m.id === id)?.label || 'Unknown';
  };

  const allOperationalData = Object.keys(transactions)
    .filter(key => {
      const isOps = operationalMenus.some(m => m.id === key);
      const isCustom = customSections.some(section => section.items.some(m => m.id === key));
      return isOps || isCustom;
    })
    .flatMap(key => {
      const sourceLabel = getMenuLabel(key);
      return (transactions[key] || []).map(t => ({ ...t, category: sourceLabel, menu_id: key }));
    });

  const allSavingsData = Object.keys(transactions)
    .filter(key => savingsMenus.some(m => m.id === key))
    .flatMap(key => {
      const sourceLabel = getMenuLabel(key);
      return (transactions[key] || []).map(t => ({ ...t, category: sourceLabel, menu_id: key }));
    });

  // Determine Current Menu Info
  let currentMenu = [...operationalMenus, ...savingsMenus].find(m => m.id === currentView);
  if (!currentMenu) {
    for (const section of customSections) {
      const found = section.items.find(m => m.id === currentView);
      if (found) {
        currentMenu = found;
        break;
      }
    }
  }

  // Data Management Handlers
  const handleResetData = async () => {
    alert("Data reset untuk database belum diimplementasi sepenuhnya di backend.");
  };

  const handleExportData = () => {
    const dataToExport = {
      operationalMenus,
      savingsMenus,
      customSections,
      transactions,
      exportDate: new Date().toISOString(),
      version: "1.1"
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-keuangan-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (importedData.version) {
          alert("Import data Lokal berhasil (Hanya untuk sesi ini). Harap dicatat bahwa data ini tidak otomatis tersimpan ke Database MySQL. Anda perlu memasukkannya secara manual untuk persistensi permanen.");

          if (importedData.operationalMenus) setOperationalMenus(restoreMenuIcons(importedData.operationalMenus));
          if (importedData.savingsMenus) setSavingsMenus(restoreMenuIcons(importedData.savingsMenus));
          if (importedData.customSections) setCustomSections(importedData.customSections);
          if (importedData.transactions) setTransactions(importedData.transactions);
        }
      } catch (error) {
        console.error("Failed to import:", error);
        alert("Gagal mengimpor data. Format file tidak valid.");
      }
    };
    reader.readAsText(file);
  };

  const handleExportFullHtml = () => {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formatRp = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

    const generateRows = (data: any[], type: 'in' | 'out') => {
      if (data.length === 0) return '<tr><td colspan="2" class="text-center text-gray">Tidak ada data</td></tr>';
      return data.map(t => `
          <tr>
            <td>
              <div class="date">${t.date}</div>
              <div class="desc">${t.description}</div>
            </td>
            <td class="text-right ${type === 'in' ? 'text-green' : 'text-red'}">
              ${type === 'in' ? '+' : '-'}${formatRp(t.amount)}
            </td>
          </tr>
        `).join('');
    };

    // Calculate Global Totals
    let globalTotalIn = 0;
    let globalTotalOut = 0;

    const generateMenuBlock = (menu: MenuItem) => {
      const menuTransactions = transactions[menu.id] || [];
      if (menuTransactions.length === 0) return '';

      const transactionsIn = menuTransactions.filter(t => t.type === 'in');
      const transactionsOut = menuTransactions.filter(t => t.type === 'out');

      const totalIn = transactionsIn.reduce((sum, t) => sum + t.amount, 0);
      const totalOut = transactionsOut.reduce((sum, t) => sum + t.amount, 0);

      // Only add to global totals if NOT operational_division
      if (menu.id !== 'operational_division') {
        globalTotalIn += totalIn;
        globalTotalOut += totalOut;
      }

      return `
        <div class="menu-block">
          <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px; margin-bottom: 20px;">
            <h3 style="margin: 0;">${menu.label}</h3>
            <div style="text-align: right;">
              <div style="font-size: 0.8rem; color: #6b7280;">Saldo Menu</div>
              <div style="font-weight: bold; color: ${totalIn - totalOut >= 0 ? '#047857' : '#b91c1c'};">
                ${formatRp(totalIn - totalOut)}
              </div>
            </div>
          </div>
          <div class="split-container">
            <div class="split-column">
              <div class="column-header header-green">
                <h4>Pemasukan</h4>
                <span class="header-total text-green">${formatRp(totalIn)}</span>
              </div>
              <table>
                <thead>
                  <tr><th>Keterangan</th><th class="text-right">Jumlah</th></tr>
                </thead>
                <tbody>${generateRows(transactionsIn, 'in')}</tbody>
              </table>
            </div>
            <div class="split-column">
              <div class="column-header header-red">
                <h4>Pengeluaran</h4>
                <span class="header-total text-red">${formatRp(totalOut)}</span>
              </div>
              <table>
                <thead>
                  <tr><th>Keterangan</th><th class="text-right">Jumlah</th></tr>
                </thead>
                <tbody>${generateRows(transactionsOut, 'out')}</tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    };

    const operationalContent = operationalMenus
      .filter(menu => menu.id !== 'operational_division' && !menu.label.toLowerCase().includes('divisi'))
      .map(menu => generateMenuBlock(menu)).join('');
    const savingsContent = savingsMenus.map(menu => generateMenuBlock(menu)).join('');
    const customContent = customSections.map(section => `
      <div class="section-header">
        <h2>${section.label}</h2>
      </div>
      ${section.items.map(menu => generateMenuBlock(menu)).join('')}
    `).join('');

    const globalSummary = `
      <div class="global-summary">
        <div class="summary-box">
          <div class="summary-label">TOTAL PEMASUKAN</div>
          <div class="summary-value text-green">+${formatRp(globalTotalIn)}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">TOTAL PENGELUARAN</div>
          <div class="summary-value text-red">-${formatRp(globalTotalOut)}</div>
        </div>
        <div class="summary-box highlighted">
          <div class="summary-label">SALDO AKHIR KESELURUHAN</div>
          <div class="summary-value">${formatRp(globalTotalIn - globalTotalOut)}</div>
        </div>
      </div>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Laporan Keuangan Lengkap - ${today}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 40px 20px; background: #f9fafb; }
          .header { text-align: center; margin-bottom: 50px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
          .header h1 { margin: 0; color: #111827; }
          .header p { color: #6b7280; margin-top: 10px; }
          .section-header { margin-top: 40px; margin-bottom: 20px; border-left: 5px solid #3b82f6; padding-left: 15px; background: #eff6ff; padding: 10px 15px; border-radius: 0 8px 8px 0; }
          .section-header h2 { margin: 0; color: #1e40af; }
          .menu-block { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 25px; margin-bottom: 30px; border: 1px solid #e5e7eb; page-break-inside: avoid; }
          .menu-block h3 { margin-top: 0; margin-bottom: 20px; color: #111827; font-size: 1.5rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px; }
          .split-container { display: flex; gap: 30px; }
          .split-column { flex: 1; }
          .column-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 10px 15px; border-radius: 8px; }
          .header-green { background: #f0fdf4; border: 1px solid #bbf7d0; }
          .header-red { background: #fef2f2; border: 1px solid #fecaca; }
          .column-header h4 { margin: 0; font-size: 1.1rem; }
          .header-total { font-weight: bold; font-size: 1.2rem; }
          .text-green { color: #15803d; }
          .text-red { color: #b91c1c; }
          .text-gray { color: #9ca3af; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
          th { text-align: left; padding: 12px; border-bottom: 2px solid #f3f4f6; color: #4b5563; }
          td { padding: 12px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
          .date { font-size: 0.8rem; color: #9ca3af; margin-bottom: 2px; }
          .desc { font-weight: 500; color: #374151; }
          .global-summary { display: flex; gap: 20px; margin-bottom: 40px; }
          .summary-box { flex: 1; background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .summary-box.highlighted { background: #1e40af; color: white; border: none; }
          .summary-box.highlighted .summary-label { color: #bfdbfe; }
          .summary-label { font-size: 0.75rem; font-weight: bold; color: #6b7280; margin-bottom: 5px; text-transform: uppercase; }
          .summary-value { font-size: 1.5rem; font-weight: bold; }
          @media print {
            body { padding: 0; background: white; }
            .menu-block { border: 1px solid #ddd; box-shadow: none; }
            .global-summary { gap: 10px; }
            .summary-box { border: 1px solid #ddd; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Laporan Keuangan Lengkap</h1>
          <p>Dicetak pada: ${today}</p>
        </div>

        ${globalSummary}

        <div class="section-header">
          <h2>Operasional</h2>
        </div>
        ${operationalContent || '<p class="text-center text-gray">Belum ada data operasional</p>'}

        <div class="section-header">
          <h2>Tabungan</h2>
        </div>
        ${savingsContent || '<p class="text-center text-gray">Belum ada data tabungan</p>'}

        ${customContent}

        <div style="text-align: center; margin-top: 50px; color: #9ca3af; font-size: 0.8rem;">
          &copy; ${new Date().getFullYear()} Laporan Keuangan Dashboard
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Keuangan_Lengkap_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Rename Logic
  const openRenameModal = (id: string, currentLabel: string) => {
    setRenamingMenuId(id);
    setNewName(currentLabel);
    setIsRenameModalOpen(true);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingMenuId || !newName) return;

    try {
      const sectionIndex = customSections.findIndex(s => s.id === renamingMenuId);
      if (sectionIndex !== -1) {
        await api.updateSection(renamingMenuId, { label: newName });
        const newSections = [...customSections];
        newSections[sectionIndex].label = newName;
        setCustomSections(newSections);
      } else {
        // Find existing menu to get other data
        let existingMenu: MenuItem | undefined;
        let menuGroup: 'operational' | 'savings' | 'custom' = 'operational';

        existingMenu = operationalMenus.find(m => m.id === renamingMenuId);
        if (!existingMenu) {
          existingMenu = savingsMenus.find(m => m.id === renamingMenuId);
          menuGroup = 'savings';
        }
        if (!existingMenu) {
          for (const s of customSections) {
            existingMenu = s.items.find(m => m.id === renamingMenuId);
            if (existingMenu) {
              menuGroup = 'custom';
              break;
            }
          }
        }

        if (existingMenu) {
          await api.updateMenu(renamingMenuId, {
            ...existingMenu,
            label: newName,
            icon_name: existingMenu.icon_name || (typeof existingMenu.icon === 'string' ? existingMenu.icon : 'Briefcase')
          });

          if (menuGroup === 'operational') {
            setOperationalMenus(operationalMenus.map(m => m.id === renamingMenuId ? { ...m, label: newName } : m));
          } else if (menuGroup === 'savings') {
            setSavingsMenus(savingsMenus.map(m => m.id === renamingMenuId ? { ...m, label: newName } : m));
          } else {
            setCustomSections(prev => prev.map(section => ({
              ...section,
              items: section.items.map(m => m.id === renamingMenuId ? { ...m, label: newName } : m)
            })));
          }
        }
      }
    } catch (error) {
      console.error("Failed to rename:", error);
    }

    setIsRenameModalOpen(false);
    setRenamingMenuId(null);
  };

  // Delete Logic
  const openDeleteModal = (id: string, label: string, isSection: boolean = false) => {
    setDeletingMenu({ id, label, isSection });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMenu) return;

    try {
      if (deletingMenu.isSection) {
        await api.deleteSection(deletingMenu.id);
        setCustomSections(customSections.filter(s => s.id !== deletingMenu.id));
        const deletedSection = customSections.find(s => s.id === deletingMenu.id);
        if (deletedSection && deletedSection.items.some(i => i.id === currentView)) {
          setCurrentView("dashboard");
        }
      } else {
        await api.deleteMenu(deletingMenu.id);
        const isOps = operationalMenus.some(m => m.id === deletingMenu.id);
        if (isOps) {
          setOperationalMenus(operationalMenus.filter(m => m.id !== deletingMenu.id));
        } else {
          const isSav = savingsMenus.some(m => m.id === deletingMenu.id);
          if (isSav) {
            setSavingsMenus(savingsMenus.filter(m => m.id !== deletingMenu.id));
          } else {
            setCustomSections(prev => prev.map(section => ({
              ...section,
              items: section.items.filter(m => m.id !== deletingMenu.id)
            })));
          }
        }

        if (currentView === deletingMenu.id) {
          setCurrentView("dashboard");
        }
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }

    setIsDeleteModalOpen(false);
    setDeletingMenu(null);
  };

  // ... rest of the component

  // Operational Saving Handlers - Unified for all operational divisions
  const handleTransferToSaving = async (divisionId: string, amount: number) => {
    const savingId = 'operational_saving'; // Single saving for all operational

    // Create new saving transaction
    const divisionName = operationalMenus.find(m => m.id === divisionId)?.label || 'Operasional';
    const newSavingTransaction: Partial<Transaction> = {
      menu_id: savingId,
      user_id: localStorage.getItem("userId") || '1',
      date: new Date().toISOString().split('T')[0],
      description: `Transfer dari ${divisionName}`,
      type: 'in',
      amount: amount,
      category: divisionName
    };

    try {
      const createdTx = await api.createTransaction(newSavingTransaction);
      // Add to unified operational saving
      setTransactions(prev => ({
        ...prev,
        [savingId]: [createdTx, ...(prev[savingId] || [])]
      }));
    } catch (error) {
      console.error("Failed to transfer to saving:", error);
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    const savingId = 'operational_saving';
    const divisionId = 'operational_division';

    // Find the transaction being canceled to get its details (category and amount)
    const txToCancel = transactions[savingId]?.find(t => String(t.id) === String(transferId));
    if (!txToCancel) return;

    try {
      // 1. Delete from Saving
      await api.deleteTransaction(transferId);

      // 2. Find and delete corresponding "expense" in checklist (if it exists)
      const targetCategory = (txToCancel.category || "").trim().toLowerCase();
      const targetAmount = Number(txToCancel.amount);

      const counterparts = (transactions[divisionId] || []).filter(t => {
        const catMatch = (t.category || "").trim().toLowerCase() === targetCategory;
        const amountMatch = Math.abs(Number(t.amount) - targetAmount) < 0.01;
        const descMatch = t.description?.toLowerCase().includes("saving") ||
          t.description?.toLowerCase().includes("alih") ||
          t.description?.toLowerCase().includes("transfer");
        return catMatch && amountMatch && descMatch;
      });

      for (const cp of counterparts) {
        await api.deleteTransaction(cp.id);
      }

      // Update state for both menus
      setTransactions(prev => {
        const newTransactions = { ...prev };
        newTransactions[savingId] = (prev[savingId] || []).filter(t => String(t.id) !== String(transferId));

        const counterpartIds = counterparts.map(cp => String(cp.id));
        newTransactions[divisionId] = (prev[divisionId] || []).filter(t =>
          !counterpartIds.includes(String(t.id))
        );

        return newTransactions;
      });

    } catch (error) {
      console.error("Failed to cancel transfer:", error);
      alert("Gagal membatalkan transfer penuh. Silakan periksa manual.");
    }
  };

  // Handle transfer from checklist to Dana Taktis
  const handleTransferChecklistToTaktis = async (divisionName: string, amount: number) => {
    try {
      const currentUserId = localStorage.getItem("userId") || '1';
      const today = new Date().toISOString().split('T')[0];

      // 1. Log to operational_taktis (deposit)
      const taktisTx = await api.createTransaction({
        menu_id: 'operational_taktis',
        user_id: currentUserId,
        date: today,
        description: `Alih Dana: ${divisionName}`,
        type: 'in',
        amount: amount,
        category: divisionName
      });

      // 2. Log to operational_division (expense)
      const divisionTx = await api.createTransaction({
        menu_id: 'operational_division',
        user_id: currentUserId,
        date: today,
        description: `Dialihkan ke Dana Taktis (${divisionName})`,
        type: 'out',
        amount: amount,
        category: divisionName
      });

      // Update state
      setTransactions(prev => ({
        ...prev,
        'operational_taktis': [taktisTx, ...(prev['operational_taktis'] || [])],
        'operational_division': [divisionTx, ...(prev['operational_division'] || [])]
      }));

    } catch (error) {
      console.error("Failed to transfer checklist to Dana Taktis:", error);
      alert("Gagal melakukan pengalihan dana ke Dana Taktis.");
    }
  };

  // Check if current view is the operational saving view
  const isOperationalSaving = currentView === 'operational_saving';
  const isOperationalDivision = currentView === 'operational_division';

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans" >
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        operationalMenus={operationalMenus}
        savingsMenus={savingsMenus}
        customSections={customSections} // Added
        onAddMenu={() => setIsAddMenuOpen(true)}
        onAddSection={() => setIsAddSectionOpen(true)} // Added
        onRenameMenu={openRenameModal}
        onDeleteMenu={openDeleteModal}
        onRenameSection={openRenameModal} // Reuse same rename modal
        onDeleteSection={(id, label) => openDeleteModal(id, label, true)} // Mark as section delete
        onLogout={handleLogout}
        onExport={() => setIsExportModalOpen(true)}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">Laporan Keuangan</h1>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
            <Menu size={24} />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {currentView === "dashboard" && (
              <div className="animate-in fade-in duration-500">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                  <p className="text-gray-500">Ringkasan aktivitas keuangan Anda.</p>
                </div>
                <DashboardHome operationalData={allOperationalData} savingsData={allSavingsData} />
              </div>
            )}

            {/* Settings View */}
            {currentView === "settings" && (
              <div className="animate-in fade-in duration-500">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Pengaturan Data</h1>
                  <p className="text-gray-500">Kelola penyimpanan dan backup data aplikasi</p>
                </div>
                <DataSettings
                  onResetData={handleResetData}
                  onExportData={handleExportData}
                  onExportHtml={handleExportFullHtml}
                  onImportData={handleImportData}
                />
              </div>
            )}

            {/* Users View */}
            {currentView === "users" && (
              <div className="animate-in fade-in duration-500">
                <UserManagement />
              </div>
            )}

            {/* Operational Saving View */}
            {isOperationalSaving && (
              <div className="animate-in fade-in duration-500">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Saving - Operasional
                  </h1>
                  <p className="text-gray-500">
                    Kelola saldo saving dari semua divisi operasional
                  </p>
                </div>
                <OperationalSavingUnified
                  operationalMenus={operationalMenus}
                  allOperationalTransactions={transactions}
                  savingTransactions={transactions['operational_saving'] || []}
                  onTransferToSaving={(divisionId, amount) => handleTransferToSaving(divisionId, amount)}
                  onCancelTransfer={(transferId) => handleCancelTransfer(transferId)}
                />
              </div>
            )}

            {/* Operational Division View */}
            {isOperationalDivision && (
              <div className="animate-in fade-in duration-500">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Pusat Operasional Divisi
                  </h1>
                  <p className="text-gray-500">
                    Kelola dan lacak pemberian dana operasional untuk setiap divisi
                  </p>
                </div>
                <OperationalDivisionManager
                  data={transactions['operational_division'] || []}
                  onAdd={(t) => handleAddTransaction('operational_division', t)}
                  onEdit={(t) => handleEditTransaction('operational_division', t)}
                  onDelete={(id) => handleDeleteTransaction('operational_division', id)}
                  onTransfer={handleTransferChecklistToTaktis}
                  operationalMenus={operationalMenus}
                />
              </div>
            )}

            {/* Savings Main View */}
            {currentView === 'savings_main' && (
              <div className="animate-in fade-in duration-500">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Pusat Tabungan</h1>
                  <p className="text-gray-500">Ringkasan total aset dan dana cadangan seluruh kategori</p>
                </div>
                <SavingsSummaryHeader
                  savingsMenus={savingsMenus}
                  allTransactions={transactions}
                  currentView={currentView}
                />
              </div>
            )}

            {currentMenu && !isOperationalSaving && !isOperationalDivision && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TransactionManager
                  title={currentMenu.type === 'operational' ? `Laporan Operasional - ${currentMenu.label}` : `Laporan Tabungan - ${currentMenu.label}`}
                  data={transactions[currentView] || []}
                  onAdd={(t) => handleAddTransaction(currentView, t)}
                  onEdit={(t) => handleEditTransaction(currentView, t)}
                  onDelete={(id) => handleDeleteTransaction(currentView, id)}
                  categories={["Umum", "Lainnya", "Project", "Maintenance", "Setoran", "Penarikan"]} // Default categories for custom menus
                  isSavings={currentMenu.type === 'savings'}
                  isOperational={currentMenu.type === 'operational'}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Menu Modal */}
      {/* Add Section Modal */}
      {isAddSectionOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Tambah Kategori Induk</h3>
              <button onClick={() => setIsAddSectionOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSection} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Nama Kategori</label>
                <Input
                  placeholder="Contoh: Investasi, Utang Piutang"
                  value={newSectionLabel}
                  onChange={(e) => setNewSectionLabel(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAddSectionOpen(false)}>
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

      {/* Add Menu Modal */}
      {
        isAddMenuOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Tambah Menu Laporan</h3>
                <button onClick={() => setIsAddMenuOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateMenu} className="p-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Nama Menu</label>
                  <Input
                    placeholder="Contoh: Divisi Marketing"
                    value={newMenuData.label}
                    onChange={(e) => setNewMenuData({ ...newMenuData, label: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Kategori Induk</label>
                  <Select
                    value={newMenuData.type}
                    onChange={(e) => setNewMenuData({ ...newMenuData, type: e.target.value })}
                  >
                    <option value="operational">Operasional</option>
                    <option value="savings">Tabungan</option>
                    {customSections.map(section => (
                      <option key={section.id} value={section.id}>{section.label}</option>
                    ))}
                  </Select>
                </div>

                <div className="pt-2 flex gap-3">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsAddMenuOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1">
                    Buat Menu
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Rename Menu Modal */}
      {
        isRenameModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Ganti Nama Menu</h3>
                <button onClick={() => setIsRenameModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleRenameSubmit} className="p-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Nama Baru</label>
                  <Input
                    placeholder="Nama Menu Baru"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsRenameModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1">
                    Simpan
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Delete Confirmation Modal */}
      {
        isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {deletingMenu?.isSection ? 'Hapus Kategori?' : 'Hapus Menu?'}
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Apakah Anda yakin ingin menghapus {deletingMenu?.isSection ? 'kategori' : 'menu'} <span className="font-medium text-gray-900">"{deletingMenu?.label}"</span>?
                  {deletingMenu?.isSection
                    ? " Semua menu di dalam kategori ini juga akan dihapus."
                    : " Data laporan di dalamnya akan disembunyikan dari dashboard."}
                </p>

                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>
                    Batal
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-700"
                    onClick={handleConfirmDelete}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={transactions}
        operationalMenus={operationalMenus}
        savingsMenus={savingsMenus}
      />
    </div >
  );
}