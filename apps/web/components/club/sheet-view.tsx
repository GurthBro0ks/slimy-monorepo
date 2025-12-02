'use client';
import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface SheetViewProps {
    data: any[];
    isLoading: boolean;
}

export function SheetView({ data, isLoading }: SheetViewProps) {
    const sheetRef = useRef<HTMLDivElement>(null);
    const spreadsheetInstance = useRef<any>(null);
    const [libLoaded, setLibLoaded] = useState(false);

    const transformData = (analyses: any[]) => {
        // 1. Identify Columns
        const metricKeys = new Set<string>();
        analyses.forEach((a) => {
            a.metrics.forEach((m: any) => metricKeys.add(m.name));
        });
        const columns = Array.from(metricKeys).sort();

        // 2. Build Header
        const rows: Record<number, any> = {};
        rows[0] = {
            cells: {
                0: { text: 'ID', style: 0 },
                1: { text: 'DATE', style: 0 },
                2: { text: 'SUMMARY', style: 0 },
                ...columns.reduce((acc, col, idx) => ({
                    ...acc,
                    [idx + 3]: { text: col.toUpperCase(), style: 0 }
                }), {})
            }
        };

        // 3. Build Rows
        analyses.forEach((analysis, idx) => {
            const rowIdx = idx + 1;
            const cells: Record<number, any> = {
                0: { text: analysis.id.substring(0, 8) },
                1: { text: new Date(analysis.createdAt).toLocaleDateString() },
                2: { text: analysis.summary || 'N/A' },
            };

            columns.forEach((col, colIdx) => {
                const metric = analysis.metrics.find((m: any) => m.name === col);
                let val = metric ? metric.value : '-';
                // Handle object values from Prisma JSON
                if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                cells[colIdx + 3] = { text: String(val) };
            });

            rows[rowIdx] = { cells };
        });

        return [{ name: 'Club_Data', rows }];
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
                    style: {
                        bgcolor: '#ffffff',
                        align: 'left',
                        valign: 'middle',
                        textwrap: false,
                        color: '#0a0a0a',
                    },
                });
            }
        }

        if (spreadsheetInstance.current && data.length > 0) {
            const formatted = transformData(data);
            spreadsheetInstance.current.loadData(formatted);
        }
    }, [libLoaded, data]);

    return (
        <div className="w-full h-full bg-white border border-black relative">
            <link rel="stylesheet" href="https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.css" />
            <Script
                src="https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.js"
                strategy="lazyOnload"
                onLoad={() => setLibLoaded(true)}
            />
            {isLoading && (
                <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center text-[#00ff00] font-mono">
                    LOADING_GRID_DATA...
                </div>
            )}
            <div id="x-spreadsheet-demo" ref={sheetRef} className="w-full h-full" />
        </div>
    );
}
