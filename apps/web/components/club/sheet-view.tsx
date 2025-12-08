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

// 1. DEFINE SHARED STYLES & STRUCTURE
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

const TEMPLATE_COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'simPower', label: 'SIM Power' },
    { key: 'totalPower', label: 'Total Power' },
    { key: 'change', label: 'Change % from last week' },
];

// 2. DEFINE THE DEFAULT WORKBOOK (Two Tabs)
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
    const [libLoaded, setLibLoaded] = useState(false);

    useImperativeHandle(ref, () => ({
        getData: () => {
            if (spreadsheetInstance.current) {
                return spreadsheetInstance.current.getData();
            }
            return null;
        }
    }));

    // 3. TRANSFORM DATA (Smart Merge)
    // Updates "Current" tab but PRESERVES "Baseline" tab if it exists
    const transformData = (analyses: any[]) => {
        // Generate the new "Current" sheet from incoming data
        const rows: Record<number, any> = {};
        rows[0] = JSON.parse(JSON.stringify(TEMPLATE_HEADER_ROW)); // Copy Headers

        analyses.forEach((analysis, idx) => {
            const rowIdx = idx + 1;
            const cells: Record<number, any> = {};

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

        // PRESERVE BASELINE LOGIC
        let baselineSheet = DEFAULT_WORKBOOK[1]; // Start with default empty baseline
        if (spreadsheetInstance.current) {
            const currentData = spreadsheetInstance.current.getData();
            // Try to find existing baseline in current workbook
            const existingBaseline = currentData.find((s: any) => s.name === 'Baseline');
            if (existingBaseline) {
                baselineSheet = existingBaseline;
            }
        }

        // Return Workbook: [New Current, Preserved Baseline]
        return [newCurrentSheet, baselineSheet];
    };

    const loadTemplate = () => {
        if (spreadsheetInstance.current) {
            console.log("Resetting to Default Workbook...");
            spreadsheetInstance.current.loadData(DEFAULT_WORKBOOK);
        }
    };

    useEffect(() => {
        if (libLoaded && sheetRef.current && !spreadsheetInstance.current) {
            const Spreadsheet = (window as any).x_spreadsheet;
            if (Spreadsheet) {
                spreadsheetInstance.current = new Spreadsheet(sheetRef.current, {
                    mode: 'edit',
                    showToolbar: false,
                    showGrid: true,
                    view: {
                        height: () => 600,
                        width: () => sheetRef.current!.clientWidth,
                    },
                    style: { bgcolor: '#ffffff', color: '#0a0a0a' },
                });

                console.log("Fetching saved workbook...");
                fetch('/api/club/sheet', { cache: 'no-store' })
                    .then(res => res.json())
                    .then(rawResponse => {
                        let cleanData = rawResponse;
                        // Unwrap { data: [...] } if necessary
                        if (!Array.isArray(rawResponse) && rawResponse.data) {
                            cleanData = rawResponse.data;
                        }

                        // Check if we have valid data (Array of sheets)
                        if (Array.isArray(cleanData) && cleanData.length > 0) {
                            // Validate it looks like a workbook (has 'name' property)
                            if (cleanData[0].name) {
                                console.log("Loading saved workbook:", cleanData.length, "sheets");
                                spreadsheetInstance.current.loadData(cleanData);
                            } else {
                                // Old single-sheet data format? Upgrade it.
                                console.log("Upgrading old data to workbook format...");
                                spreadsheetInstance.current.loadData(DEFAULT_WORKBOOK);
                            }
                        } else {
                            console.log("No saved data. Loading Default Workbook.");
                            spreadsheetInstance.current.loadData(DEFAULT_WORKBOOK);
                        }
                    })
                    .catch(err => {
                        console.error("Failed to load sheet data:", err);
                        spreadsheetInstance.current.loadData(DEFAULT_WORKBOOK);
                    });
            }
        }

        // Handle incoming scan data
        if (spreadsheetInstance.current && data.length > 0) {
            const formattedWorkbook = transformData(data);
            spreadsheetInstance.current.loadData(formattedWorkbook);
        }
    }, [libLoaded, data]);

    return (
        <div className="w-full h-full bg-white border border-black relative group">
            <link rel="stylesheet" href="https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.css" />
            <Script
                src="https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.js"
                strategy="lazyOnload"
                onLoad={() => setLibLoaded(true)}
            />

            <button
                onClick={loadTemplate}
                className="absolute top-2 right-2 z-20 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
            >
                Reset Workbook
            </button>

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
