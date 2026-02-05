import React, { useState } from "react";
import { X, Download, FileSpreadsheet, Briefcase, Landmark, Check, FileText, Globe } from "lucide-react";
import { Button } from "./ui/Primitives";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Transaction } from "./TransactionManager";
import { MenuItem } from "./Sidebar";
import { format } from "date-fns";
import { cn } from "../lib/utils";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Record<string, Transaction[]>;
    operationalMenus: MenuItem[];
    savingsMenus: MenuItem[];
}

export const ExportModal = ({
    isOpen,
    onClose,
    transactions,
    operationalMenus,
    savingsMenus
}: ExportModalProps) => {
    const [selectedOps, setSelectedOps] = useState(true);
    const [selectedSavings, setSelectedSavings] = useState(true);
    const [exportFormat, setExportFormat] = useState<'xlsx' | 'pdf' | 'html'>('xlsx');
    const [isExporting, setIsExporting] = useState(false);

    if (!isOpen) return null;

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const fileNameBase = `laporan_keuangan_${format(new Date(), 'yyyy-MM-dd_HHmm')}`;

            if (exportFormat === 'xlsx') {
                const wb = XLSX.utils.book_new();

                if (selectedOps) {
                    const opsData = collectOpsData();
                    const groupedData = groupByMenu(opsData);

                    const sheetData: any[] = [];
                    let grandTotalIn = 0;
                    let grandTotalOut = 0;

                    Object.entries(groupedData).forEach(([menuName, items]: [string, any[]]) => {
                        const incomeItems = items.filter((t: any) => t.type === 'in');
                        const expenseItems = items.filter((t: any) => t.type === 'out');

                        // Menu header
                        sheetData.push({
                            'Tanggal (Masuk)': `═══ ${menuName} ═══`,
                            'Keterangan (Masuk)': '',
                            'Nominal (Masuk)': '',
                            '': '',
                            'Tanggal (Keluar)': '',
                            'Keterangan (Keluar)': '',
                            'Nominal (Keluar)': ''
                        });

                        // Column headers
                        sheetData.push({
                            'Tanggal (Masuk)': '📈 PEMASUKAN',
                            'Keterangan (Masuk)': '',
                            'Nominal (Masuk)': '',
                            '': '',
                            'Tanggal (Keluar)': '📉 PENGELUARAN',
                            'Keterangan (Keluar)': '',
                            'Nominal (Keluar)': ''
                        });

                        sheetData.push({
                            'Tanggal (Masuk)': 'Tanggal',
                            'Keterangan (Masuk)': 'Keterangan',
                            'Nominal (Masuk)': 'Nominal',
                            '': '',
                            'Tanggal (Keluar)': 'Tanggal',
                            'Keterangan (Keluar)': 'Keterangan',
                            'Nominal (Keluar)': 'Nominal'
                        });

                        // Data rows - side by side
                        const maxRows = Math.max(incomeItems.length, expenseItems.length);
                        for (let i = 0; i < maxRows; i++) {
                            const incomeItem = incomeItems[i];
                            const expenseItem = expenseItems[i];

                            sheetData.push({
                                'Tanggal (Masuk)': incomeItem ? incomeItem.date : '',
                                'Keterangan (Masuk)': incomeItem ? incomeItem.description : '',
                                'Nominal (Masuk)': incomeItem ? incomeItem.amount : '',
                                '': '',
                                'Tanggal (Keluar)': expenseItem ? expenseItem.date : '',
                                'Keterangan (Keluar)': expenseItem ? expenseItem.description : '',
                                'Nominal (Keluar)': expenseItem ? expenseItem.amount : ''
                            });
                        }

                        // Subtotals
                        const subtotalIn = incomeItems.reduce((sum: number, item: any) => sum + item.amount, 0);
                        const subtotalOut = expenseItems.reduce((sum: number, item: any) => sum + item.amount, 0);
                        grandTotalIn += subtotalIn;
                        grandTotalOut += subtotalOut;

                        sheetData.push({
                            'Tanggal (Masuk)': '',
                            'Keterangan (Masuk)': 'SUBTOTAL',
                            'Nominal (Masuk)': subtotalIn,
                            '': '',
                            'Tanggal (Keluar)': '',
                            'Keterangan (Keluar)': 'SUBTOTAL',
                            'Nominal (Keluar)': subtotalOut
                        });

                        // Saldo for this menu
                        const saldo = subtotalIn - subtotalOut;
                        sheetData.push({
                            'Tanggal (Masuk)': '',
                            'Keterangan (Masuk)': '',
                            'Nominal (Masuk)': '',
                            '': `SALDO: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(saldo)}`,
                            'Tanggal (Keluar)': '',
                            'Keterangan (Keluar)': '',
                            'Nominal (Keluar)': ''
                        });

                        // Empty row separator
                        sheetData.push({
                            'Tanggal (Masuk)': '',
                            'Keterangan (Masuk)': '',
                            'Nominal (Masuk)': '',
                            '': '',
                            'Tanggal (Keluar)': '',
                            'Keterangan (Keluar)': '',
                            'Nominal (Keluar)': ''
                        });
                    });

                    // Grand totals
                    sheetData.push({
                        'Tanggal (Masuk)': '═══════════════════════',
                        'Keterangan (Masuk)': '',
                        'Nominal (Masuk)': '',
                        '': '',
                        'Tanggal (Keluar)': '═══════════════════════',
                        'Keterangan (Keluar)': '',
                        'Nominal (Keluar)': ''
                    });

                    sheetData.push({
                        'Tanggal (Masuk)': '',
                        'Keterangan (Masuk)': 'TOTAL PEMASUKAN',
                        'Nominal (Masuk)': grandTotalIn,
                        '': '',
                        'Tanggal (Keluar)': '',
                        'Keterangan (Keluar)': 'TOTAL PENGELUARAN',
                        'Nominal (Keluar)': grandTotalOut
                    });

                    sheetData.push({
                        'Tanggal (Masuk)': '',
                        'Keterangan (Masuk)': '',
                        'Nominal (Masuk)': '',
                        '': `SALDO AKHIR: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(grandTotalIn - grandTotalOut)}`,
                        'Tanggal (Keluar)': '',
                        'Keterangan (Keluar)': '',
                        'Nominal (Keluar)': ''
                    });

                    const wsOps = XLSX.utils.json_to_sheet(sheetData);

                    // Set column widths
                    wsOps['!cols'] = [
                        { wch: 12 },  // Tanggal (Masuk)
                        { wch: 30 },  // Keterangan (Masuk)
                        { wch: 15 },  // Nominal (Masuk)
                        { wch: 3 },   // Separator
                        { wch: 12 },  // Tanggal (Keluar)
                        { wch: 30 },  // Keterangan (Keluar)
                        { wch: 15 }   // Nominal (Keluar)
                    ];

                    XLSX.utils.book_append_sheet(wb, wsOps, "Laporan Operasional");
                }

                if (selectedSavings) {
                    const savingsData = collectSavingsData();
                    const groupedData = groupByMenu(savingsData);

                    const sheetData: any[] = [];
                    let grandTotalIn = 0;
                    let grandTotalOut = 0;

                    Object.entries(groupedData).forEach(([menuName, items]: [string, any[]]) => {
                        const incomeItems = items.filter((t: any) => t.type === 'in');
                        const expenseItems = items.filter((t: any) => t.type === 'out');

                        // Menu header
                        sheetData.push({
                            'Tanggal (Masuk)': `═══ ${menuName} ═══`,
                            'Keterangan (Masuk)': '',
                            'Nominal (Masuk)': '',
                            '': '',
                            'Tanggal (Keluar)': '',
                            'Keterangan (Keluar)': '',
                            'Nominal (Keluar)': ''
                        });

                        // Column headers
                        sheetData.push({
                            'Tanggal (Masuk)': '📈 PEMASUKAN',
                            'Keterangan (Masuk)': '',
                            'Nominal (Masuk)': '',
                            '': '',
                            'Tanggal (Keluar)': '📉 PENGELUARAN',
                            'Keterangan (Keluar)': '',
                            'Nominal (Keluar)': ''
                        });

                        sheetData.push({
                            'Tanggal (Masuk)': 'Tanggal',
                            'Keterangan (Masuk)': 'Keterangan',
                            'Nominal (Masuk)': 'Nominal',
                            '': '',
                            'Tanggal (Keluar)': 'Tanggal',
                            'Keterangan (Keluar)': 'Keterangan',
                            'Nominal (Keluar)': 'Nominal'
                        });

                        // Data rows - side by side
                        const maxRows = Math.max(incomeItems.length, expenseItems.length);
                        for (let i = 0; i < maxRows; i++) {
                            const incomeItem = incomeItems[i];
                            const expenseItem = expenseItems[i];

                            sheetData.push({
                                'Tanggal (Masuk)': incomeItem ? incomeItem.date : '',
                                'Keterangan (Masuk)': incomeItem ? incomeItem.description : '',
                                'Nominal (Masuk)': incomeItem ? incomeItem.amount : '',
                                '': '',
                                'Tanggal (Keluar)': expenseItem ? expenseItem.date : '',
                                'Keterangan (Keluar)': expenseItem ? expenseItem.description : '',
                                'Nominal (Keluar)': expenseItem ? expenseItem.amount : ''
                            });
                        }

                        // Subtotals
                        const subtotalIn = incomeItems.reduce((sum: number, item: any) => sum + item.amount, 0);
                        const subtotalOut = expenseItems.reduce((sum: number, item: any) => sum + item.amount, 0);
                        grandTotalIn += subtotalIn;
                        grandTotalOut += subtotalOut;

                        sheetData.push({
                            'Tanggal (Masuk)': '',
                            'Keterangan (Masuk)': 'SUBTOTAL',
                            'Nominal (Masuk)': subtotalIn,
                            '': '',
                            'Tanggal (Keluar)': '',
                            'Keterangan (Keluar)': 'SUBTOTAL',
                            'Nominal (Keluar)': subtotalOut
                        });

                        // Saldo for this menu
                        const saldo = subtotalIn - subtotalOut;
                        sheetData.push({
                            'Tanggal (Masuk)': '',
                            'Keterangan (Masuk)': '',
                            'Nominal (Masuk)': '',
                            '': `SALDO: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(saldo)}`,
                            'Tanggal (Keluar)': '',
                            'Keterangan (Keluar)': '',
                            'Nominal (Keluar)': ''
                        });

                        // Empty row separator
                        sheetData.push({
                            'Tanggal (Masuk)': '',
                            'Keterangan (Masuk)': '',
                            'Nominal (Masuk)': '',
                            '': '',
                            'Tanggal (Keluar)': '',
                            'Keterangan (Keluar)': '',
                            'Nominal (Keluar)': ''
                        });
                    });

                    // Grand totals
                    sheetData.push({
                        'Tanggal (Masuk)': '═══════════════════════',
                        'Keterangan (Masuk)': '',
                        'Nominal (Masuk)': '',
                        '': '',
                        'Tanggal (Keluar)': '═══════════════════════',
                        'Keterangan (Keluar)': '',
                        'Nominal (Keluar)': ''
                    });

                    sheetData.push({
                        'Tanggal (Masuk)': '',
                        'Keterangan (Masuk)': 'TOTAL PEMASUKAN',
                        'Nominal (Masuk)': grandTotalIn,
                        '': '',
                        'Tanggal (Keluar)': '',
                        'Keterangan (Keluar)': 'TOTAL PENGELUARAN',
                        'Nominal (Keluar)': grandTotalOut
                    });

                    sheetData.push({
                        'Tanggal (Masuk)': '',
                        'Keterangan (Masuk)': '',
                        'Nominal (Masuk)': '',
                        '': `SALDO AKHIR: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(grandTotalIn - grandTotalOut)}`,
                        'Tanggal (Keluar)': '',
                        'Keterangan (Keluar)': '',
                        'Nominal (Keluar)': ''
                    });

                    const wsSavings = XLSX.utils.json_to_sheet(sheetData);

                    wsSavings['!cols'] = [
                        { wch: 12 },  // Tanggal (Masuk)
                        { wch: 30 },  // Keterangan (Masuk)
                        { wch: 15 },  // Nominal (Masuk)
                        { wch: 3 },   // Separator
                        { wch: 12 },  // Tanggal (Keluar)
                        { wch: 30 },  // Keterangan (Keluar)
                        { wch: 15 }   // Nominal (Keluar)
                    ];

                    XLSX.utils.book_append_sheet(wb, wsSavings, "Laporan Tabungan");
                }

                XLSX.writeFile(wb, `${fileNameBase}.xlsx`);
            } else if (exportFormat === 'pdf') {
                const doc = new jsPDF() as any;
                let currentY = 15;

                doc.setFontSize(20);
                doc.text("Laporan Keuangan", 14, currentY);
                currentY += 10;
                doc.setFontSize(10);
                doc.text(`Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`, 14, currentY);
                currentY += 10;

                const formatCurrency = (amount: number) =>
                    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

                if (selectedOps) {
                    doc.setFontSize(16);
                    doc.setTextColor(37, 99, 235);
                    doc.text("LAPORAN OPERASIONAL", 14, currentY);
                    doc.setTextColor(0, 0, 0);
                    currentY += 8;

                    const opsData = collectOpsData();
                    const groupedData = groupByMenu(opsData);
                    let grandTotalIn = 0;
                    let grandTotalOut = 0;

                    Object.entries(groupedData).forEach(([menuName, items]: [string, any[]]) => {
                        if (currentY > 250) {
                            doc.addPage();
                            currentY = 20;
                        }

                        // Menu header
                        doc.setFontSize(11);
                        doc.setFont(undefined, 'bold');
                        doc.text(`▸ ${menuName}`, 14, currentY);
                        doc.setFont(undefined, 'normal');
                        currentY += 5;

                        const incomeItems = items.filter((t: any) => t.type === 'in');
                        const expenseItems = items.filter((t: any) => t.type === 'out');

                        // Create side-by-side table data
                        const maxRows = Math.max(incomeItems.length, expenseItems.length);
                        const tableBody: any[] = [];

                        for (let i = 0; i < maxRows; i++) {
                            const incomeItem = incomeItems[i];
                            const expenseItem = expenseItems[i];

                            tableBody.push([
                                incomeItem ? incomeItem.date : '',
                                incomeItem ? incomeItem.description : '',
                                incomeItem ? formatCurrency(incomeItem.amount) : '',
                                expenseItem ? expenseItem.date : '',
                                expenseItem ? expenseItem.description : '',
                                expenseItem ? formatCurrency(expenseItem.amount) : ''
                            ]);
                        }

                        // Render dual-column table
                        doc.autoTable({
                            startY: currentY,
                            head: [[
                                { content: '📈 PEMASUKAN', colSpan: 3, styles: { halign: 'center', fillColor: [16, 185, 129] } },
                                { content: '📉 PENGELUARAN', colSpan: 3, styles: { halign: 'center', fillColor: [239, 68, 68] } }
                            ], [
                                'Tanggal', 'Keterangan', 'Nominal',
                                'Tanggal', 'Keterangan', 'Nominal'
                            ]],
                            body: tableBody,
                            theme: 'grid',
                            headStyles: { fontSize: 8, fillColor: [241, 245, 249] },
                            bodyStyles: { fontSize: 7 },
                            columnStyles: {
                                0: { cellWidth: 18 },
                                1: { cellWidth: 35 },
                                2: { cellWidth: 25, halign: 'right' },
                                3: { cellWidth: 18 },
                                4: { cellWidth: 35 },
                                5: { cellWidth: 25, halign: 'right' }
                            },
                            margin: { left: 14, right: 14 }
                        });
                        currentY = (doc as any).lastAutoTable.finalY + 3;

                        // Subtotals
                        const subtotalIn = incomeItems.reduce((sum: number, item: any) => sum + item.amount, 0);
                        const subtotalOut = expenseItems.reduce((sum: number, item: any) => sum + item.amount, 0);
                        grandTotalIn += subtotalIn;
                        grandTotalOut += subtotalOut;

                        doc.setFontSize(8);
                        doc.setFont(undefined, 'bold');
                        doc.text(`Subtotal: ${formatCurrency(subtotalIn)}`, 20, currentY);
                        doc.text(`Subtotal: ${formatCurrency(subtotalOut)}`, 120, currentY);
                        currentY += 4;

                        // Saldo for this menu
                        const saldo = subtotalIn - subtotalOut;
                        doc.setFontSize(9);
                        doc.setTextColor(37, 99, 235);
                        doc.text(`SALDO: ${formatCurrency(saldo)}`, 105, currentY, { align: 'center' });
                        doc.setTextColor(0, 0, 0);
                        doc.setFont(undefined, 'normal');
                        currentY += 8;
                    });

                    // Grand totals for operational
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    doc.text(`TOTAL PEMASUKAN: ${formatCurrency(grandTotalIn)}`, 14, currentY);
                    currentY += 5;
                    doc.text(`TOTAL PENGELUARAN: ${formatCurrency(grandTotalOut)}`, 14, currentY);
                    currentY += 5;
                    doc.setTextColor(37, 99, 235);
                    doc.setFontSize(11);
                    doc.text(`SALDO AKHIR: ${formatCurrency(grandTotalIn - grandTotalOut)}`, 14, currentY);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(undefined, 'normal');
                    currentY += 15;
                }

                if (selectedSavings) {
                    if (currentY > 200) {
                        doc.addPage();
                        currentY = 20;
                    }

                    doc.setFontSize(16);
                    doc.setTextColor(16, 185, 129);
                    doc.text("LAPORAN TABUNGAN", 14, currentY);
                    doc.setTextColor(0, 0, 0);
                    currentY += 8;

                    const savingsData = collectSavingsData();
                    const groupedData = groupByMenu(savingsData);
                    let grandTotalIn = 0;
                    let grandTotalOut = 0;

                    Object.entries(groupedData).forEach(([menuName, items]: [string, any[]]) => {
                        if (currentY > 250) {
                            doc.addPage();
                            currentY = 20;
                        }

                        doc.setFontSize(11);
                        doc.setFont(undefined, 'bold');
                        doc.text(`▸ ${menuName}`, 14, currentY);
                        doc.setFont(undefined, 'normal');
                        currentY += 5;

                        const incomeItems = items.filter((t: any) => t.type === 'in');
                        const expenseItems = items.filter((t: any) => t.type === 'out');

                        // Create side-by-side table data
                        const maxRows = Math.max(incomeItems.length, expenseItems.length);
                        const tableBody: any[] = [];

                        for (let i = 0; i < maxRows; i++) {
                            const incomeItem = incomeItems[i];
                            const expenseItem = expenseItems[i];

                            tableBody.push([
                                incomeItem ? incomeItem.date : '',
                                incomeItem ? incomeItem.description : '',
                                incomeItem ? formatCurrency(incomeItem.amount) : '',
                                expenseItem ? expenseItem.date : '',
                                expenseItem ? expenseItem.description : '',
                                expenseItem ? formatCurrency(expenseItem.amount) : ''
                            ]);
                        }

                        // Render dual-column table
                        doc.autoTable({
                            startY: currentY,
                            head: [[
                                { content: '📈 PEMASUKAN', colSpan: 3, styles: { halign: 'center', fillColor: [16, 185, 129] } },
                                { content: '📉 PENGELUARAN', colSpan: 3, styles: { halign: 'center', fillColor: [239, 68, 68] } }
                            ], [
                                'Tanggal', 'Keterangan', 'Nominal',
                                'Tanggal', 'Keterangan', 'Nominal'
                            ]],
                            body: tableBody,
                            theme: 'grid',
                            headStyles: { fontSize: 8, fillColor: [241, 245, 249] },
                            bodyStyles: { fontSize: 7 },
                            columnStyles: {
                                0: { cellWidth: 18 },
                                1: { cellWidth: 35 },
                                2: { cellWidth: 25, halign: 'right' },
                                3: { cellWidth: 18 },
                                4: { cellWidth: 35 },
                                5: { cellWidth: 25, halign: 'right' }
                            },
                            margin: { left: 14, right: 14 }
                        });
                        currentY = (doc as any).lastAutoTable.finalY + 3;

                        // Subtotals
                        const subtotalIn = incomeItems.reduce((sum: number, item: any) => sum + item.amount, 0);
                        const subtotalOut = expenseItems.reduce((sum: number, item: any) => sum + item.amount, 0);
                        grandTotalIn += subtotalIn;
                        grandTotalOut += subtotalOut;

                        doc.setFontSize(8);
                        doc.setFont(undefined, 'bold');
                        doc.text(`Subtotal: ${formatCurrency(subtotalIn)}`, 20, currentY);
                        doc.text(`Subtotal: ${formatCurrency(subtotalOut)}`, 120, currentY);
                        currentY += 4;

                        // Saldo for this menu
                        const saldo = subtotalIn - subtotalOut;
                        doc.setFontSize(9);
                        doc.setTextColor(16, 185, 129);
                        doc.text(`SALDO: ${formatCurrency(saldo)}`, 105, currentY, { align: 'center' });
                        doc.setTextColor(0, 0, 0);
                        doc.setFont(undefined, 'normal');
                        currentY += 8;
                    });

                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    doc.text(`TOTAL PEMASUKAN: ${formatCurrency(grandTotalIn)}`, 14, currentY);
                    currentY += 5;
                    doc.text(`TOTAL PENGELUARAN: ${formatCurrency(grandTotalOut)}`, 14, currentY);
                    currentY += 5;
                    doc.setTextColor(16, 185, 129);
                    doc.setFontSize(11);
                    doc.text(`SALDO AKHIR: ${formatCurrency(grandTotalIn - grandTotalOut)}`, 14, currentY);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(undefined, 'normal');
                }

                doc.save(`${fileNameBase}.pdf`);
            } else if (exportFormat === 'html') {
                const formatCurrency = (amount: number) =>
                    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

                let html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Laporan Keuangan</title>
                        <meta charset="UTF-8">
                        <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body { 
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                                padding: 40px; 
                                background: #f8fafc;
                                color: #334155;
                            }
                            .container {
                                max-width: 1400px;
                                margin: 0 auto;
                                background: white;
                                padding: 40px;
                                border-radius: 12px;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                            }
                            h1 { 
                                color: #1e293b; 
                                border-bottom: 3px solid #e2e8f0; 
                                padding-bottom: 15px;
                                margin-bottom: 10px;
                                font-size: 32px;
                            }
                            .print-date {
                                color: #64748b;
                                font-size: 14px;
                                margin-bottom: 30px;
                            }
                            .section-title {
                                font-size: 24px;
                                font-weight: bold;
                                margin: 40px 0 20px 0;
                                padding: 12px 16px;
                                border-radius: 8px;
                                color: white;
                                text-align: center;
                            }
                            .section-ops { background: linear-gradient(135deg, #2563eb, #3b82f6); }
                            .section-savings { background: linear-gradient(135deg, #10b981, #34d399); }
                            .menu-group {
                                margin-bottom: 40px;
                                border: 1px solid #e2e8f0;
                                border-radius: 8px;
                                overflow: hidden;
                            }
                            .menu-header {
                                font-size: 18px;
                                font-weight: bold;
                                color: #1e293b;
                                background: #f8fafc;
                                padding: 15px;
                                border-bottom: 1px solid #e2e8f0;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                            }
                            .side-by-side {
                                display: flex;
                                gap: 0;
                            }
                            .column {
                                flex: 1;
                                min-width: 0;
                            }
                            .column-left { border-right: 1px solid #e2e8f0; }
                            .col-header {
                                font-size: 14px;
                                font-weight: 700;
                                padding: 10px;
                                text-align: center;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                            }
                            .income-header { background: #d1fae5; color: #065f46; }
                            .expense-header { background: #fee2e2; color: #991b1b; }
                            table { 
                                width: 100%; 
                                border-collapse: collapse; 
                                font-size: 12px;
                            }
                            th, td { 
                                padding: 10px 8px; 
                                text-align: left; 
                                border-bottom: 1px solid #f1f5f9;
                            }
                            th { 
                                background: #f8fafc; 
                                font-weight: 600;
                                color: #64748b;
                                font-size: 11px;
                                text-transform: uppercase;
                            }
                            .nominal { 
                                font-family: 'Courier New', monospace; 
                                text-align: right;
                                font-weight: 600;
                            }
                            .subtotal-row {
                                background: #f8fafc;
                                font-weight: bold;
                            }
                            .saldo-container {
                                background: #f1f5f9;
                                padding: 15px;
                                text-align: center;
                                font-size: 16px;
                                font-weight: bold;
                                color: #1e293b;
                                border-top: 1px solid #e2e8f0;
                            }
                            .grand-total {
                                margin-top: 50px;
                                padding: 30px;
                                background: #1e293b;
                                border-radius: 12px;
                                color: white;
                            }
                            .grand-total-row {
                                display: flex;
                                justify-content: space-between;
                                padding: 10px 0;
                                font-size: 16px;
                                border-bottom: 1px solid rgba(255,255,255,0.1);
                            }
                            .grand-total-row.final {
                                font-size: 24px;
                                font-weight: bold;
                                color: #3b82f6;
                                border-bottom: none;
                                padding-top: 15px;
                                margin-top: 5px;
                            }
                            .text-income { color: #10b981; }
                            .text-expense { color: #ef4444; }
                            @media print {
                                body { background: white; padding: 0; }
                                .container { box-shadow: none; border: none; max-width: 100%; }
                                .grand-total { background: #f1f5f9; color: #1e293b; border: 1px solid #e2e8f0; }
                                .grand-total-row.final { color: #2563eb; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Laporan Keuangan</h1>
                            <div class="print-date">Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm')}</div>
                `;

                const generateSectionHtml = (title: string, data: any[], cssClass: string) => {
                    const grouped = groupByMenu(data);
                    let sectionIn = 0;
                    let sectionOut = 0;
                    let sectionHtml = `<div class="section-title ${cssClass}">${title}</div>`;

                    Object.entries(grouped).forEach(([menuName, items]: [string, any[]]) => {
                        const incomeItems = items.filter((t: any) => t.type === 'in');
                        const expenseItems = items.filter((t: any) => t.type === 'out');
                        const subIn = incomeItems.reduce((sum: number, t: any) => sum + t.amount, 0);
                        const subOut = expenseItems.reduce((sum: number, t: any) => sum + t.amount, 0);
                        sectionIn += subIn;
                        sectionOut += subOut;

                        const maxRows = Math.max(incomeItems.length, expenseItems.length);

                        sectionHtml += `
                            <div class="menu-group">
                                <div class="menu-header">
                                    <span>▸ ${menuName}</span>
                                </div>
                                <div class="side-by-side">
                                    <!-- Column Pemasukan -->
                                    <div class="column column-left">
                                        <div class="col-header income-header">📈 PEMASUKAN</div>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Tanggal</th>
                                                    <th>Keterangan</th>
                                                    <th style="text-align:right">Nominal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${Array.from({ length: maxRows }).map((_, i) => {
                            const item = incomeItems[i];
                            return `
                                                        <tr>
                                                            <td>${item ? item.date : ''}</td>
                                                            <td>${item ? item.description : ''}</td>
                                                            <td class="nominal">${item ? formatCurrency(item.amount) : ''}</td>
                                                        </tr>
                                                    `;
                        }).join('')}
                                                <tr class="subtotal-row">
                                                    <td colspan="2">SUBTOTAL PEMASUKAN</td>
                                                    <td class="nominal text-income">${formatCurrency(subIn)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <!-- Column Pengeluaran -->
                                    <div class="column">
                                        <div class="col-header expense-header">📉 PENGELUARAN</div>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Tanggal</th>
                                                    <th>Keterangan</th>
                                                    <th style="text-align:right">Nominal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${Array.from({ length: maxRows }).map((_, i) => {
                            const item = expenseItems[i];
                            return `
                                                        <tr>
                                                            <td>${item ? item.date : ''}</td>
                                                            <td>${item ? item.description : ''}</td>
                                                            <td class="nominal">${item ? formatCurrency(item.amount) : ''}</td>
                                                        </tr>
                                                    `;
                        }).join('')}
                                                <tr class="subtotal-row">
                                                    <td colspan="2">SUBTOTAL PENGELUARAN</td>
                                                    <td class="nominal text-expense">${formatCurrency(subOut)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="saldo-container">
                                    SALDO: <span style="color: ${subIn - subOut >= 0 ? '#10b981' : '#ef4444'}">${formatCurrency(subIn - subOut)}</span>
                                </div>
                            </div>
                        `;
                    });

                    return { html: sectionHtml, totalIn: sectionIn, totalOut: sectionOut };
                };

                let opsTotal = { totalIn: 0, totalOut: 0 };
                let savingsTotal = { totalIn: 0, totalOut: 0 };

                if (selectedOps) {
                    const opsData = collectOpsData();
                    const result = generateSectionHtml('LAPORAN OPERASIONAL', opsData, 'section-ops');
                    html += result.html;
                    opsTotal = { totalIn: result.totalIn, totalOut: result.totalOut };

                    // Saldo Akhir Operasional
                    html += `
                        <div class="section-summary" style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 25px; border-radius: 12px; margin: 20px 0 40px 0;">
                            <h3 style="margin: 0 0 15px 0; font-size: 16px; opacity: 0.9;">📊 RINGKASAN OPERASIONAL</h3>
                            <div style="display: flex; justify-content: space-between; gap: 20px;">
                                <div style="flex: 1; text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                                    <div style="font-size: 12px; opacity: 0.8;">Total Pemasukan</div>
                                    <div style="font-size: 20px; font-weight: bold; color: #86efac;">${formatCurrency(opsTotal.totalIn)}</div>
                                </div>
                                <div style="flex: 1; text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                                    <div style="font-size: 12px; opacity: 0.8;">Total Pengeluaran</div>
                                    <div style="font-size: 20px; font-weight: bold; color: #fca5a5;">${formatCurrency(opsTotal.totalOut)}</div>
                                </div>
                                <div style="flex: 1; text-align: center; padding: 15px; background: rgba(255,255,255,0.2); border-radius: 8px;">
                                    <div style="font-size: 12px; opacity: 0.8;">Saldo Akhir Operasional</div>
                                    <div style="font-size: 24px; font-weight: bold;">${formatCurrency(opsTotal.totalIn - opsTotal.totalOut)}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                if (selectedSavings) {
                    const savingsData = collectSavingsData();
                    const result = generateSectionHtml('LAPORAN TABUNGAN', savingsData, 'section-savings');
                    html += result.html;
                    savingsTotal = { totalIn: result.totalIn, totalOut: result.totalOut };

                    // Saldo Akhir Tabungan
                    html += `
                        <div class="section-summary" style="background: linear-gradient(135deg, #047857 0%, #10b981 100%); color: white; padding: 25px; border-radius: 12px; margin: 20px 0 40px 0;">
                            <h3 style="margin: 0 0 15px 0; font-size: 16px; opacity: 0.9;">💰 RINGKASAN TABUNGAN</h3>
                            <div style="display: flex; justify-content: space-between; gap: 20px;">
                                <div style="flex: 1; text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                                    <div style="font-size: 12px; opacity: 0.8;">Total Pemasukan</div>
                                    <div style="font-size: 20px; font-weight: bold; color: #86efac;">${formatCurrency(savingsTotal.totalIn)}</div>
                                </div>
                                <div style="flex: 1; text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                                    <div style="font-size: 12px; opacity: 0.8;">Total Pengeluaran</div>
                                    <div style="font-size: 20px; font-weight: bold; color: #fca5a5;">${formatCurrency(savingsTotal.totalOut)}</div>
                                </div>
                                <div style="flex: 1; text-align: center; padding: 15px; background: rgba(255,255,255,0.2); border-radius: 8px;">
                                    <div style="font-size: 12px; opacity: 0.8;">Saldo Akhir Tabungan</div>
                                    <div style="font-size: 24px; font-weight: bold;">${formatCurrency(savingsTotal.totalIn - savingsTotal.totalOut)}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Grand Total (gabungan jika keduanya dipilih)
                const grandTotalIn = opsTotal.totalIn + savingsTotal.totalIn;
                const grandTotalOut = opsTotal.totalOut + savingsTotal.totalOut;

                html += `
                            <div class="grand-total">
                                <h3 style="margin: 0 0 20px 0; font-size: 18px; text-align: center; opacity: 0.9;">📈 REKAPITULASI KESELURUHAN</h3>
                                ${selectedOps && selectedSavings ? `
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                                    <div style="padding: 15px; background: rgba(59, 130, 246, 0.3); border-radius: 8px; text-align: center;">
                                        <div style="font-size: 12px; opacity: 0.8;">Saldo Operasional</div>
                                        <div style="font-size: 18px; font-weight: bold;">${formatCurrency(opsTotal.totalIn - opsTotal.totalOut)}</div>
                                    </div>
                                    <div style="padding: 15px; background: rgba(16, 185, 129, 0.3); border-radius: 8px; text-align: center;">
                                        <div style="font-size: 12px; opacity: 0.8;">Saldo Tabungan</div>
                                        <div style="font-size: 18px; font-weight: bold;">${formatCurrency(savingsTotal.totalIn - savingsTotal.totalOut)}</div>
                                    </div>
                                </div>
                                ` : ''}
                                <div class="grand-total-row">
                                    <span>TOTAL PEMASUKAN</span>
                                    <span class="text-income">${formatCurrency(grandTotalIn)}</span>
                                </div>
                                <div class="grand-total-row">
                                    <span>TOTAL PENGELUARAN</span>
                                    <span class="text-expense">${formatCurrency(grandTotalOut)}</span>
                                </div>
                                <div class="grand-total-row final">
                                    <span>SALDO AKHIR KESELURUHAN</span>
                                    <span>${formatCurrency(grandTotalIn - grandTotalOut)}</span>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${fileNameBase}.html`;
                link.click();
                URL.revokeObjectURL(url);
            }

            onClose();
        } catch (error) {
            console.error("Export failed:", error);
            alert("Gagal melakukan ekspor data.");
        } finally {
            setIsExporting(false);
        }
    };

    const groupByMenu = (data: any[]): Record<string, any[]> => {
        const grouped: Record<string, any[]> = {};
        data.forEach((item: any) => {
            const menuName = item.Menu || 'Lainnya';
            // Filter out Divisi-related entries
            if (menuName.toLowerCase().includes('divisi') || menuName.toLowerCase().includes('ceklist')) {
                return;
            }
            if (!grouped[menuName]) {
                grouped[menuName] = [];
            }
            grouped[menuName].push(item);
        });
        return grouped;
    };

    const collectOpsData = () => {
        let opsData: any[] = [];
        // Menghilangkan Operasional Divisi (Ceklist) dari ekspor - tidak mengambil data dari operational_division

        operationalMenus.forEach(menu => {
            // Skip menu Divisi berdasarkan ID atau label
            if (menu.id === 'operational_division') return;
            if (menu.label.toLowerCase().includes('divisi')) return;

            const menuData = transactions[menu.id] || [];
            opsData = opsData.concat(menuData.map(t => ({ ...t, Menu: menu.label })));
        });

        if (transactions['operational_saving'] && !operationalMenus.some(m => m.id === 'operational_saving')) {
            opsData = opsData.concat(transactions['operational_saving'].map(t => ({ ...t, Menu: 'Saving - Operasional (Legacy)' })));
        }

        opsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return opsData;
    };

    const collectSavingsData = () => {
        let savingsData: any[] = [];
        savingsMenus.forEach(menu => {
            const menuData = transactions[menu.id] || [];
            savingsData = savingsData.concat(menuData.map(t => ({ ...t, Menu: menu.label })));
        });
        savingsData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return savingsData;
    };

    const formatForSheet = (data: any[], type: 'Operational' | 'Savings') => {
        return data.map(item => ({
            [type === 'Operational' ? 'Menu/Kategori' : 'Menu/Tabungan']: item.Menu,
            'Tanggal': item.date,
            'Keterangan': item.description,
            'Tipe': item.type === 'in' ? 'Masuk' : 'Keluar',
            'Nominal': item.amount,
            'Kategori': item.category || '-'
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Ekspor Data</h3>
                            <p className="text-xs text-slate-500">Unduh laporan keuangan ke berbagai format</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Data Laporan</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Operational Checkbox */}
                            <div
                                onClick={() => setSelectedOps(!selectedOps)}
                                className={cn(
                                    "relative flex flex-col gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group hover:-translate-y-0.5",
                                    selectedOps
                                        ? "border-blue-500 bg-blue-50/30"
                                        : "border-slate-100 hover:border-blue-200 bg-white"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div className={cn(
                                        "p-2.5 rounded-lg shadow-sm border",
                                        selectedOps ? "bg-blue-500 text-white border-blue-600" : "bg-white text-slate-400 border-slate-100 group-hover:border-blue-100"
                                    )}>
                                        <Briefcase size={20} />
                                    </div>
                                    {selectedOps && (
                                        <div className="absolute top-3 right-3 p-1 bg-blue-500 text-white rounded-full">
                                            <Check size={12} className="stroke-[3]" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Operasional</div>
                                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Hardware, SI, Taktis, & Divisi
                                    </div>
                                </div>
                            </div>

                            {/* Savings Checkbox */}
                            <div
                                onClick={() => setSelectedSavings(!selectedSavings)}
                                className={cn(
                                    "relative flex flex-col gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group hover:-translate-y-0.5",
                                    selectedSavings
                                        ? "border-emerald-500 bg-emerald-50/30"
                                        : "border-slate-100 hover:border-emerald-200 bg-white"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div className={cn(
                                        "p-2.5 rounded-lg shadow-sm border",
                                        selectedSavings ? "bg-emerald-500 text-white border-emerald-600" : "bg-white text-slate-400 border-slate-100 group-hover:border-emerald-100"
                                    )}>
                                        <Landmark size={20} />
                                    </div>
                                    {selectedSavings && (
                                        <div className="absolute top-3 right-3 p-1 bg-emerald-500 text-white rounded-full">
                                            <Check size={12} className="stroke-[3]" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Tabungan</div>
                                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Semua kategori tabungan
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Format Dokumen</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'xlsx', label: 'Excel', desc: 'Spreadsheet', icon: FileSpreadsheet, color: 'text-green-600', activeBg: 'bg-green-50 border-green-200', activeRing: 'ring-green-500/20' },
                                { id: 'pdf', label: 'PDF', desc: 'Dokumen', icon: FileText, color: 'text-red-600', activeBg: 'bg-red-50 border-red-200', activeRing: 'ring-red-500/20' },
                                { id: 'html', label: 'HTML', desc: 'Halaman Web', icon: Globe, color: 'text-blue-600', activeBg: 'bg-blue-50 border-blue-200', activeRing: 'ring-blue-500/20' },
                            ].map((fmt) => (
                                <button
                                    key={fmt.id}
                                    onClick={() => setExportFormat(fmt.id as any)}
                                    className={cn(
                                        "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 hover:-translate-y-0.5",
                                        exportFormat === fmt.id
                                            ? cn("shadow-sm ring-4", fmt.activeBg, fmt.activeRing)
                                            : "border-slate-100 hover:border-slate-200 bg-white"
                                    )}
                                >
                                    <div className={cn("p-2 rounded-lg bg-white shadow-sm border border-slate-100", fmt.color)}>
                                        <fmt.icon size={24} />
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs font-bold text-slate-700">{fmt.label}</div>
                                        <div className="text-[10px] text-slate-400">{fmt.desc}</div>
                                    </div>

                                    {exportFormat === fmt.id && (
                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current text-inherit animate-pulse" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={onClose}>
                        Batal
                    </Button>
                    <Button
                        className="flex-1 gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10"
                        onClick={handleExport}
                        disabled={!selectedOps && !selectedSavings || isExporting}
                    >
                        {isExporting ? (
                            <>Menyiapkan...</>
                        ) : (
                            <>
                                <Download size={18} />
                                Unduh {exportFormat.toUpperCase()}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
