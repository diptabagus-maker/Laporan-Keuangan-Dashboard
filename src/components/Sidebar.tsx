import React, { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Landmark,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Monitor,
  Server,
  Layers,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  Settings,
  FolderPlus,
  FolderOpen,
  PiggyBank,
  Users,
  Download
} from "lucide-react";
import { cn } from "../lib/utils";

export type ViewType = "dashboard" | "operational_hardware" | "operational_si" | "savings_main" | "savings_others" | "settings" | "users" | string;

export interface MenuItem {
  id: string;
  label: string;
  type: 'operational' | 'savings' | string;
  icon?: any;
  icon_name?: string;
  section_id?: string;
}

export interface Section {
  id: string;
  label: string;
  items: MenuItem[];
  user_id?: string;
}

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  operationalMenus: MenuItem[];
  savingsMenus: MenuItem[];
  customSections: Section[]; // Added
  onAddMenu: () => void;
  onAddSection: () => void; // Added
  onRenameMenu: (id: string, currentLabel: string) => void;
  onDeleteMenu: (id: string, label: string) => void;
  onRenameSection: (id: string, currentLabel: string) => void;
  onDeleteSection: (id: string, label: string) => void;
  onLogout: () => void;
  onExport: () => void;
}

export const Sidebar = ({
  currentView,
  setCurrentView,
  isOpen,
  setIsOpen,
  operationalMenus,
  savingsMenus,
  customSections = [], // Default empty
  onAddMenu,
  onAddSection, // Added
  onRenameMenu,
  onDeleteMenu,
  onRenameSection, // Added
  onDeleteSection,
  onLogout,
  onExport
}: SidebarProps) => {
  const [isOpsOpen, setIsOpsOpen] = useState(true);
  const [isSavingsOpen, setIsSavingsOpen] = useState(true);
  // State for custom sections open/close
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderMenuItem = (menu: MenuItem) => {
    // Safely get the icon component
    const IconComponent = menu.icon && typeof menu.icon === 'function' ? menu.icon : Monitor;

    return (
      <div key={menu.id} className="relative group">
        <button
          onClick={() => {
            setCurrentView(menu.id);
            setIsOpen(false);
          }}
          className={cn(
            "flex w-full items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-2 pr-16",
            currentView === menu.id
              ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
              : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
          )}
        >
          <IconComponent size={16} />
          <span className="truncate">{menu.label}</span>
        </button>

        {!(menu.id === 'operational_hardware' || menu.id === 'operational_si' || menu.id === 'operational_saving') && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRenameMenu(menu.id, menu.label);
              }}
              className="p-1 text-slate-500 hover:text-blue-400"
              title="Rename"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteMenu(menu.id, menu.label);
              }}
              className="p-1 text-slate-500 hover:text-red-400"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-white">Laporan Keuangan</h1>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-2 flex-1 overflow-y-auto">
          {/* Dashboard */}
          <button
            onClick={() => {
              setCurrentView("dashboard");
              setIsOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              currentView === "dashboard"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>


          {/* Operational Group */}
          <div>
            <button
              onClick={() => setIsOpsOpen(!isOpsOpen)}
              className={cn(
                "flex w-full items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:bg-slate-800 hover:text-white",
                (operationalMenus.some(m => m.id === currentView) || currentView === 'operational_saving') && "text-white bg-slate-800/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Briefcase size={18} />
                Operasional
              </div>
              {isOpsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {isOpsOpen && (
              <div className="mt-1 space-y-1 px-2">
                {operationalMenus
                  .filter(m => m.id !== 'operational_saving')
                  .map(menu => renderMenuItem(menu))}

                {/* Single Saving submenu for all operational divisions */}
                <button
                  onClick={() => {
                    setCurrentView('operational_saving');
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-2 mt-2",
                    currentView === 'operational_saving'
                      ? "bg-green-600/20 text-green-400 border border-green-600/30"
                      : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                  )}
                >
                  <PiggyBank size={16} />
                  <span className="truncate">Saving</span>
                </button>
              </div>
            )}
          </div>

          {/* Savings Group */}
          <div>
            <button
              onClick={() => {
                setCurrentView("savings_main");
                setIsOpen(false);
                setIsSavingsOpen(true); // Ensure expanded when clicked
              }}
              className={cn(
                "flex w-full items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:bg-slate-800 hover:text-white",
                (currentView === "savings_main" || savingsMenus.some(m => m.id === currentView)) && "text-white bg-slate-800/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Landmark size={18} className={currentView === "savings_main" ? "text-blue-400" : ""} />
                Tabungan
              </div>
              <div
                className="p-1 hover:bg-slate-700 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSavingsOpen(!isSavingsOpen);
                }}
              >
                {isSavingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </button>

            {isSavingsOpen && (
              <div className="mt-1 space-y-1 px-2">
                {savingsMenus.map(menu => renderMenuItem(menu))}
              </div>
            )}
          </div>

          {/* Custom Sections */}
          {customSections.map(section => (
            <div key={section.id} className="relative group/section">
              <button
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:bg-slate-800 hover:text-white group",
                  section.items.some(m => m.id === currentView) && "text-white bg-slate-800/50"
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <FolderOpen size={18} />
                  <span className="truncate">{section.label}</span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Action buttons */}
                  <div className="flex items-center opacity-0 group-hover/section:opacity-100 transition-opacity mr-2">
                    <div
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRenameSection(section.id, section.label);
                      }}
                      className="p-1 hover:text-blue-400 text-slate-500"
                      title="Rename Category"
                    >
                      <Edit2 size={14} />
                    </div>
                    <div
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSection(section.id, section.label);
                      }}
                      className="p-1 hover:text-red-400 text-slate-500"
                      title="Delete Category"
                    >
                      <Trash2 size={14} />
                    </div>
                  </div>
                  {(openSections[section.id] ?? true) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </button>

              {(openSections[section.id] ?? true) && (
                <div className="mt-1 space-y-1 px-2">
                  {section.items.length > 0 ? (
                    section.items.map(menu => renderMenuItem(menu))
                  ) : (
                    <div className="px-4 py-2 text-xs text-slate-600 italic">Belum ada menu</div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Actions Group */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={onAddSection}
              className="flex flex-col items-center justify-center gap-2 px-2 py-3 rounded-lg text-xs font-medium transition-colors text-slate-400 hover:bg-slate-800 hover:text-white border border-dashed border-slate-700 hover:border-slate-500"
            >
              <FolderPlus size={18} />
              <span>Kategori</span>
            </button>
            <button
              onClick={onAddMenu}
              className="flex flex-col items-center justify-center gap-2 px-2 py-3 rounded-lg text-xs font-medium transition-colors text-slate-400 hover:bg-slate-800 hover:text-white border border-dashed border-slate-700 hover:border-slate-500"
            >
              <Plus size={18} />
              <span>Menu</span>
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => {
              setCurrentView("settings");
              setIsOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              currentView === "settings"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Settings size={18} />
            Pengaturan
          </button>

          {/* Users Button */}
          <button
            onClick={() => {
              setCurrentView("users");
              setIsOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              currentView === "users"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Users size={18} />
            Pengguna
          </button>

          {/* Export Button */}
          <button
            onClick={() => {
              onExport();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <Download size={18} />
            Ekspor Data
          </button>

        </div>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 px-4 py-3 text-slate-400 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
              {localStorage.getItem("username")?.substring(0, 2).toUpperCase() || "AD"}
            </div>
            <div className="text-xs flex-1">
              <p className="font-medium text-slate-200">{localStorage.getItem("username") || "Admin User"}</p>
              <p>Logged In</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:bg-red-900/20 hover:text-red-400 border border-slate-700 hover:border-red-500"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};