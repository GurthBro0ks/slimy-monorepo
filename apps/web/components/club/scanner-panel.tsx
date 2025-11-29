'use client';
import { useState, useRef } from 'react';
import { Upload, Eye, FileImage } from 'lucide-react';

export function ScannerPanel({ guildId, onScanComplete }: { guildId: string, onScanComplete: () => void }) {
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<string>('IDLE');
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) return;
        const validFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
        setFiles(prev => [...prev, ...validFiles]);
    };

    const runScan = async () => {
        if (files.length === 0) return;
        setStatus('UPLOADING');
        setProgress(10);

        try {
            // 1. Upload Images
            const formData = new FormData();
            // Backend expects 'screenshots' key
            files.forEach(f => formData.append('screenshots', f));
            formData.append('guildId', guildId);

            const uploadRes = await fetch('/api/club/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.statusText}`);
            const uploadData = await uploadRes.json();
            const imageUrls = uploadData.results.map((r: any) => r.url);

            setProgress(50);
            setStatus('ANALYZING');

            // 2. Trigger Analysis
            const analyzeRes = await fetch('/api/club/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guildId, imageUrls })
            });

            if (!analyzeRes.ok) throw new Error('Analysis failed');

            setProgress(100);
            setStatus('DONE');
            setTimeout(() => {
                onScanComplete();
                setFiles([]);
                setStatus('IDLE');
                setProgress(0);
            }, 1000);

        } catch (err) {
            console.error(err);
            setStatus('ERROR');
            alert("Scan failed. Check console for details.");
        }
    };

    return (
        <div className="bg-[#240046] border-2 border-[#9d4edd] shadow-[0_0_15px_rgba(157,78,221,0.4)] flex flex-col mb-6">
            <div className="h-8 bg-gradient-to-r from-[#3c096c] to-[#10002b] flex items-center justify-between px-2 border-b-2 border-[#10002b] text-[#ff00ff] font-mono text-xs">
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#00ff00]" />
                    <span>AI_OCR_SCANNER_MODULE</span>
                </div>
                <span className="text-[#e0aaff] font-mono">{status === 'IDLE' ? 'READY' : status}</span>
            </div>

            <div className="p-3 flex flex-col md:flex-row gap-4 bg-black/30 min-h-[180px]">
                <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
                    <label className="text-[#e0aaff] font-mono text-sm">Target Guild:</label>
                    <div className="bg-[#10002b] border border-[#9d4edd] text-[#00ff00] p-2 font-mono text-sm">
                        {guildId || "NO_GUILD_SELECTED"}
                    </div>
                    <div className="flex-1" />
                    <button
                        onClick={() => setFiles([])}
                        className="bg-[#240046] border border-[#9d4edd] text-[#e0aaff] font-mono hover:bg-[#3c096c] hover:text-white transition-all py-1"
                    >
                        CLEAR QUEUE
                    </button>
                    <button
                        onClick={runScan}
                        disabled={status !== 'IDLE'}
                        className="bg-[#004d00] border border-[#00ff00] text-[#00ff00] font-mono hover:bg-[#00ff00] hover:text-black transition-all py-1 disabled:opacity-50"
                    >
                        {status === 'IDLE' ? 'INITIALIZE SCAN' : 'PROCESSING...'}
                    </button>
                </div>

                <div
                    className="flex-1 border-2 border-dashed border-[#00ff00] bg-[#00ff00]/5 hover:bg-[#00ff00]/10 transition-colors rounded cursor-pointer flex flex-col items-center justify-center text-[#00ff00] p-4 relative overflow-hidden"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        handleFiles(e.dataTransfer.files);
                    }}
                >
                    <Upload className="w-8 h-8 mb-2" />
                    <div className="font-mono text-lg">DRAG SCREENSHOTS HERE</div>
                    <div className="text-xs text-[#9d4edd] mt-1">or click to browse</div>
                    <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)} />
                    {status !== 'IDLE' && (
                        <div className="absolute bottom-0 left-0 h-1.5 bg-[#10002b] w-full border-t border-[#5a189a]">
                            <div className="h-full bg-[#00ff00] transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
