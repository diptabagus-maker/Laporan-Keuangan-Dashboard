import React from "react";
import { PiggyBank, Landmark, TrendingUp, Info } from "lucide-react";
import { Card } from "./ui/Primitives";
import { cn } from "../lib/utils";

interface Transaction {
    id: string;
    type: "in" | "out";
    amount: number;
}

interface SavingMenuSummary {
    id: string;
    label: string;
    balance: number;
}

interface SavingsSummaryHeaderProps {
    savingsMenus: { id: string, label: string }[];
    allTransactions: Record<string, Transaction[]>;
    currentView: string;
}

export const SavingsSummaryHeader = ({ savingsMenus, allTransactions, currentView }: SavingsSummaryHeaderProps) => {
    // Calculate balances for each savings menu (excluding operational saving)
    const menuSummaries: SavingMenuSummary[] = savingsMenus
        .filter(menu => menu.id !== 'operational_saving')
        .map(menu => {
            const txs = allTransactions[menu.id] || [];
            const income = txs.filter(t => t.type === 'in').reduce((sum, t) => sum + Number(t.amount || 0), 0);
            const expense = txs.filter(t => t.type === 'out').reduce((sum, t) => sum + Number(t.amount || 0), 0);
            return {
                id: menu.id,
                label: menu.label,
                balance: income - expense
            };
        });

    const grandTotal = menuSummaries.reduce((sum, m) => sum + m.balance, 0);

    const formatIDR = (num: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    };

    return (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="p-0 border-none bg-white shadow-md overflow-hidden">
                <div className="flex flex-col md:flex-row">
                    {/* Main Total Highlight */}
                    <div className="p-6 md:w-1/3 bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2 opacity-80">
                            <Landmark size={18} />
                            <span className="text-sm font-medium uppercase tracking-wider">Total Seluruh Tabungan</span>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            {formatIDR(grandTotal)}
                        </h2>
                        <div className="flex items-center gap-2 mt-4 text-emerald-100/80 text-xs">
                            <TrendingUp size={14} />
                            <span>Akumulasi dari {menuSummaries.length} Kategori</span>
                        </div>
                    </div>

                    {/* Breakdown per Menu */}
                    <div className="flex-1 p-6 bg-slate-50/50">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <PiggyBank size={14} />
                            Rincian per Submenu
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {menuSummaries.map((menu) => (
                                <div
                                    key={menu.id}
                                    className={cn(
                                        "p-3 rounded-xl border transition-all",
                                        currentView === menu.id
                                            ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/10"
                                            : "bg-white border-slate-100 hover:border-slate-200 shadow-sm"
                                    )}
                                >
                                    <p className="text-[10px] font-bold text-slate-400 uppercase truncate mb-1">
                                        {menu.label}
                                    </p>
                                    <p className={cn(
                                        "text-sm font-bold",
                                        menu.balance >= 0 ? "text-emerald-600" : "text-rose-600"
                                    )}>
                                        {formatIDR(menu.balance)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Visual Guide Tip */}
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-100/50 px-4 py-2 rounded-full w-fit">
                <Info size={14} className="text-blue-500" />
                <span>Saldo di atas adalah akumulasi dana dari seluruh kategori tabungan yang Anda kelola.</span>
            </div>
        </div>
    );
};
