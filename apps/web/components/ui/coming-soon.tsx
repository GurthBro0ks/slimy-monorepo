import React, { ReactNode } from "react";

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <h1 className="text-6xl font-bold text-[#8a4baf] tracking-tighter drop-shadow-[0_0_10px_#8a4baf]">
        {title}
      </h1>
      <div className="bg-[#1a0b2e] border-2 border-[#00ffff] p-12 text-center relative group max-w-2xl">
        {icon && (
          <div className="text-5xl mb-4 text-[#00ffff] animate-pulse">
            {icon}
          </div>
        )}
        <p className="text-3xl text-[#00ffff] relative z-10">
          COMING SOON
        </p>
        {description && (
          <p className="mt-4 text-[#d6b4fc] opacity-60 relative z-10 text-lg">
            {description}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <span className="w-2 h-2 bg-[#00ffff] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-[#00ffff] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-[#00ffff] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
