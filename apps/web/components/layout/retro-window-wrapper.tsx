export function RetroWindowWrapper({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="w-full max-w-6xl mx-auto border-2 border-[#9d4edd] bg-[#240046] shadow-[0_0_20px_rgba(157,78,221,0.6)] flex flex-col my-8">
       <div className="h-10 bg-gradient-to-r from-[#3c096c] to-[#10002b] flex items-center px-4 border-b border-[#10002b]">
         <div className="w-4 h-4 bg-[#00ff00] rounded-full mr-3 animate-pulse"></div>
         <span className="text-[#ff00ff] font-mono font-bold tracking-widest text-lg">{title}</span>
       </div>
       <div className="p-1 bg-[#10002b]">
         {children}
       </div>
    </div>
  );
}
