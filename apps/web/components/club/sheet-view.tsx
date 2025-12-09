'use client';
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import Script from 'next/script';

interface SheetViewProps {
    data: any[];
    isLoading: boolean;
}

export interface SheetViewHandle {
    getData: () => any;
}

const HEADER_STYLE = {
    bgcolor: '#f3f3f3',
    color: '#000000',
    align: 'center',
    valign: 'middle',
    font: { bold: true, size: 10 }
};

const TEMPLATE_COLS = {
    0: { width: 200 }, // Name
    1: { width: 120 }, // SIM Power
    2: { width: 120 }, // Total Power
    3: { width: 180 }, // Change %
};

const TEMPLATE_HEADER_ROW = {
    cells: {
        0: { text: 'Name', style: 0 },
        1: { text: 'SIM Power', style: 0 },
        2: { text: 'Total Power', style: 0 },
        3: { text: 'Change % from last week', style: 0 },
    }
};

const DEFAULT_WORKBOOK = [
    {
        name: 'Current',
        freeze: 'A2',
        styles: [HEADER_STYLE],
        cols: TEMPLATE_COLS,
        rows: { 0: TEMPLATE_HEADER_ROW }
    },
    {
        name: 'Baseline',
        freeze: 'A2',
        styles: [HEADER_STYLE],
        cols: TEMPLATE_COLS,
        rows: { 0: TEMPLATE_HEADER_ROW }
    }
];

export const SheetView = forwardRef<SheetViewHandle, SheetViewProps>(({ data, isLoading }, ref) => {
    const sheetRef = useRef<HTMLDivElement>(null);
    const spreadsheetInstance = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [libLoaded, setLibLoaded] = useState(false);

    useImperativeHandle(ref, () => ({
        getData: () => {
            if (spreadsheetInstance.current) {
                return spreadsheetInstance.current.getData();
            }
            return null;
        }
    }));

    // CSV PARSER
    const parseCSV = (text: string) => {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        const rows: Record<number, any> = {};

        rows[0] = JSON.parse(JSON.stringify(TEMPLATE_HEADER_ROW));

        let startIndex = 0;
        if (lines[0].toLowerCase().includes('power') || lines[0].toLowerCase().includes('name')) {
            startIndex = 1;
        }

        lines.slice(startIndex).forEach((line, idx) => {
            const cols = line.split(',');
            const rowIdx = idx + 1;
            rows[rowIdx] = {
                cells: {
                    0: { text: cols[0]?.trim() || '' },
                    1: { text: cols[1]?.trim() || '' },
                    2: { text: cols[2]?.trim() || '' },
                    3: { text: cols[3]?.trim() || '' }
                }
            };
        });
        return rows;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !spreadsheetInstance.current) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const newRows = parseCSV(text);
            const workbook = spreadsheetInstance.current.getData();

            let baselineIndex = workbook.findIndex((s: any) => s.name === 'Baseline');
            if (baselineIndex === -1) {
                workbook.push({ ...DEFAULT_WORKBOOK[1], rows: newRows });
            } else {
                workbook[baselineIndex].rows = newRows;
            }

            console.log("Uploaded Baseline Data:", Object.keys(newRows).length, "rows");
            spreadsheetInstance.current.loadData(workbook);
        };
        reader.readAsText(file);
    };

    const transformData = (analyses: any[]) => {
        const rows: Record<number, any> = {};
        rows[0] = JSON.parse(JSON.stringify(TEMPLATE_HEADER_ROW));

        analyses.forEach((analysis, idx) => {
            const rowIdx = idx + 1;
            const cells: Record<number, any> = {};
            const TEMPLATE_COLUMNS = [
                { key: 'name', label: 'Name' },
                { key: 'simPower', label: 'SIM Power' },
                { key: 'totalPower', label: 'Total Power' },
                { key: 'change', label: 'Change % from last week' },
            ];

            TEMPLATE_COLUMNS.forEach((col, colIdx) => {
                let value = '';
                if (analysis[col.key]) value = analysis[col.key];
                else if (analysis.metrics) {
                    const metric = analysis.metrics.find((m: any) => {
                        const mName = m.name.toLowerCase();
                        const target = col.label.toLowerCase();
                        return mName.includes(target) || target.includes(mName);
                    });
                    if (metric) value = metric.value;
                }
                if (col.key === 'name' && !value) value = analysis.id || 'Unknown';
                cells[colIdx] = { text: String(value) };
            });
            rows[rowIdx] = { cells };
        });

        const newCurrentSheet = {
            name: 'Current',
            styles: [HEADER_STYLE],
            cols: TEMPLATE_COLS,
            rows: rows
        };

        let baselineSheet = DEFAULT_WORKBOOK[1];
        if (spreadsheetInstance.current) {
            const currentData = spreadsheetInstance.current.getData();
            const existingBaseline = currentData.find((s: any) => s.name === 'Baseline');
            if (existingBaseline) baselineSheet = existingBaseline;
        }

        return [newCurrentSheet, baselineSheet];
    };

    useEffect(() => {
        if (libLoaded && sheetRef.current && !spreadsheetInstance.current) {
            const Spreadsheet = (window as any).x_spreadsheet;
            if (Spreadsheet) {
                spreadsheetInstance.current = new Spreadsheet(sheetRef.current, {
                    mode: 'edit',
                    showToolbar: true,
                    showGrid: true,
                    view: {
                        // FIX: Strict fallback height of 800px if clientHeight fails
                        height: () => sheetRef.current ? Math.max(sheetRef.current.clientHeight, 800) : 800,
                        width: () => sheetRef.current ? sheetRef.current.clientWidth : 1000,
                    },
                    style: { bgcolor: '#ffffff', color: '#0a0a0a' },
                });

                fetch('/api/club/sheet', { cache: 'no-store' })
                    .then(res => res.json())
                    .then(rawResponse => {
                        let cleanData = rawResponse;
                        if (!Array.isArray(rawResponse) && rawResponse.data) cleanData = rawResponse.data;

                        let finalWorkbook = DEFAULT_WORKBOOK;
                        if (Array.isArray(cleanData) && cleanData.length > 0) {
                            if (cleanData.length >= 2) {
                                finalWorkbook = cleanData;
                            } else if (cleanData.length === 1) {
                                const oldSheet = cleanData[0];
                                const upgradedCurrent = { ...oldSheet, name: 'Current' };
                                finalWorkbook = [upgradedCurrent, DEFAULT_WORKBOOK[1]];
                            }
                        }
                        spreadsheetInstance.current.loadData(finalWorkbook);
                    })
                    .catch(() => spreadsheetInstance.current.loadData(DEFAULT_WORKBOOK));
            }
        }

        if (spreadsheetInstance.current && data.length > 0) {
            const formatted = transformData(data);
            spreadsheetInstance.current.loadData(formatted);
        }
    }, [libLoaded, data]);

    return (
        // FIX: Added min-h-[800px] to FORCE height
        <div className="w-full h-full min-h-[800px] bg-white border border-black relative group">
            <link rel="stylesheet" href="https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.css" />
            <Script
                src="https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.js"
                strategy="lazyOnload"
                onLoad={() => setLibLoaded(true)}
            />

            <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700"
                >
                    Upload Baseline CSV
                </button>
                <button
                    onClick={() => spreadsheetInstance.current?.loadData(DEFAULT_WORKBOOK)}
                    className="bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700"
                >
                    Reset Workbook
                </button>
            </div>

            {isLoading && (
                <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center text-[#00ff00] font-mono">
                    LOADING_GRID_DATA...
                </div>
            )}
            <div id="x-spreadsheet-demo" ref={sheetRef} className="w-full h-full" />
        </div>
    );
});

SheetView.displayName = 'SheetView';
