import React, { useMemo } from "react";
import { Card } from "./ui/Primitives";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Activity,
  Calendar,
  Briefcase,
  Receipt,
  PiggyBank,
  Landmark,
  ClipboardList,
  History
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: "in" | "out";
  amount: number;
  category: string;
  menu_id?: string;
}

interface DashboardProps {
  operationalData: Transaction[];
  savingsData: Transaction[];
}

export const DashboardHome = ({ operationalData, savingsData }: DashboardProps) => {
  // 1. Hardware Metrics
  const hwData = operationalData.filter(t => t.menu_id === 'operational_hardware');
  const hwIn = hwData.filter(t => t.type === 'in').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const hwOut = hwData.filter(t => t.type === 'out').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const hwBalance = hwIn - hwOut;

  // 2. Sistem Informasi Metrics
  const siData = operationalData.filter(t => t.menu_id === 'operational_si');
  const siIn = siData.filter(t => t.type === 'in').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const siOut = siData.filter(t => t.type === 'out').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const siBalance = siIn - siOut;

  // 3. Overall Dashboard Metrics (HW + SI only)
  const totalBalance = hwBalance + siBalance;
  const totalOut = hwOut + siOut;
  const totalIn = hwIn + siIn;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const formatShortIDR = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'M';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'jt';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'rb';
    return num.toString();
  };

  // Recent operational activity (HW + SI)
  const recentOps = operationalData
    .filter(t => t.menu_id === 'operational_hardware' || t.menu_id === 'operational_si')
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 8);

  // Chart Data (Last 6 Months) - Hardware & SI combined
  const chartData = useMemo(() => {
    const months: Record<string, { name: string; income: number; expense: number; fullDate: string }> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      const monthName = d.toLocaleString('id-ID', { month: 'short' });
      months[key] = { name: monthName, income: 0, expense: 0, fullDate: key };
    }

    operationalData.forEach(t => {
      if (t.menu_id !== 'operational_hardware' && t.menu_id !== 'operational_si') return;
      const key = t.date.slice(0, 7);
      const amount = Number(t.amount || 0);
      if (months[key]) {
        if (t.type === 'in') months[key].income += amount;
        else months[key].expense += amount;
      }
    });

    return Object.values(months);
  }, [operationalData]);

  const TransactionList = ({ title, data, icon: Icon, colorClass }: { title: string, data: Transaction[], icon: any, colorClass: string }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-50 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Icon size={18} className={colorClass} />
          {title}
        </h3>
        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
          Terbaru
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {data.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {data.map((t, index) => (
              <div key={`${t.id}-${index}`} className="p-4 hover:bg-slate-50/50 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                      t.type === 'in' ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" : "bg-rose-50 text-rose-600 group-hover:bg-rose-100"
                    )}>
                      {t.type === 'in' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-900 line-clamp-1">{t.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {t.date}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {t.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={cn(
                    "font-semibold text-sm whitespace-nowrap",
                    t.type === 'in' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {t.type === 'in' ? '+' : '-'}{formatIDR(t.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Activity size={32} className="mb-2 opacity-20" />
            <p className="text-sm">Belum ada transaksi</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header Stats Area */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Kas Operasional</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Saldo Hardware"
            value={formatIDR(hwBalance)}
            icon={<Activity className="text-white" />}
            trend={hwBalance >= 0 ? "up" : "down"}
            gradient="from-blue-500 to-blue-600"
            subText="Kas Bagian Hardware"
          />
          <StatsCard
            title="Saldo Sistem Informasi"
            value={formatIDR(siBalance)}
            icon={<TrendingUp className="text-white" />}
            trend={siBalance >= 0 ? "up" : "down"}
            gradient="from-indigo-500 to-indigo-600"
            subText="Kas Sistem Informasi"
          />
          <StatsCard
            title="Total Saldo"
            value={formatIDR(totalBalance)}
            icon={<Landmark className="text-white" />}
            trend="neutral"
            gradient="from-violet-500 to-violet-600"
            subText="Gabungan HW + SI"
          />
          <StatsCard
            title="Total Pengeluaran"
            value={formatIDR(totalOut)}
            icon={<Receipt className="text-white" />}
            trend="down"
            gradient="from-rose-500 to-rose-600"
            subText="Bulan Februari 2026"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-800 text-lg">Analisis Arus Kas Operasional</h3>
              <p className="text-sm text-slate-500">Hardware & Sistem Informasi (6 bulan terakhir)</p>
            </div>
            <div className="flex gap-2 text-xs font-medium">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Masuk</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span>Keluar</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => formatShortIDR(value)}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [formatIDR(value), '']}
                  labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                />
                <Bar
                  dataKey="income"
                  name="Pemasukan"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="expense"
                  name="Pengeluaran"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Summary / Status */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none h-full flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Activity size={120} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Status Saldo</p>
              <h3 className="text-2xl font-bold mb-4">Kas Operasional</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Dashboard ini hanya menampilkan kas aktif dari Bagian Hardware dan Sistem Informasi. Seluruh data tabungan dikelola secara terpisah di menu Saving.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Rasio Penggunaan Dana</span>
                <span className="text-sm font-bold text-emerald-400">
                  {totalIn > 0 ? ((totalOut / totalIn) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${totalIn > 0 ? ((totalOut / totalIn) * 100) : 0}%` }}
                ></div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Transaction List */}
      <div className="h-[450px]">
        <TransactionList
          title="Aktivitas Operasional Terkini"
          data={recentOps}
          icon={ClipboardList}
          colorClass="text-blue-600"
        />
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon, subText, gradient }: {
  title: string,
  value: string,
  icon: React.ReactNode,
  trend: "up" | "down" | "neutral",
  subText?: string,
  gradient: string
}) => (
  <div className="relative group overflow-hidden bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-3 rounded-xl shadow-lg shadow-blue-500/20 bg-gradient-to-br", gradient)}>
        {icon}
      </div>
      {/* Optional decorative element */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
    </div>

    <div className="relative z-10">
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
      {subText && (
        <p className="text-xs text-slate-400 mt-2 font-medium">
          {subText}
        </p>
      )}
    </div>
  </div>
);
