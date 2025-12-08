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

    const transformData = (analyses: any[]) => {
        if (analyses.length > 0 && (analyses[0] as any).rows) {
            return analyses;
        }

        const metricKeys = new Set<string>();
        analyses.forEach((a) => {
            if (a.metrics) {
                a.metrics.forEach((m: any) => metricKeys.add(m.name));
            }
        });
        const columns = Array.from(metricKeys).sort();

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

        analyses.forEach((analysis, idx) => {
            const rowIdx = idx + 1;
            const cells: Record<number, any> = {
                0: { text: analysis.id ? analysis.id.substring(0, 8) : '?' },
                1: { text: analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : '-' },
                2: { text: analysis.summary || 'N/A' },
            };

            columns.forEach((col, colIdx) => {
                const metric = analysis.metrics ? analysis.metrics.find((m: any) => m.name === col) : null;
                let val = metric ? metric.value : '-';
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

                // FIX: Load saved data from API on startup
                console.log("Fetching saved sheet data...");
                fetch('/api/club/sheet', { cache: 'no-store' })
                    .then(res => res.json())
                    .then(rawResponse => {
                        console.log("Raw Server Response:", rawResponse);

                        let cleanData = rawResponse;
                        if (!Array.isArray(rawResponse) && rawResponse.data && Array.isArray(rawResponse.data)) {
                            console.log("Unwrapping data object...");
                            cleanData = rawResponse.data;
                        }

                        if (Array.isArray(cleanData) && cleanData.length > 0) {
                            console.log("Loading rows into Grid:", cleanData.length);
                            spreadsheetInstance.current.loadData(cleanData);
                        } else {
                            console.log("No saved data found, starting empty.");
                        }
                    })
                    .catch(err => console.error("Failed to load sheet data:", err));
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
});

SheetView.displayName = 'SheetView';
