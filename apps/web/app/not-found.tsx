import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-[#d6b4fc] font-mono flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Image
            src="/images/logo.svg"
            alt="SlimyAI Logo"
            width={60}
            height={60}
            className="w-16 h-16"
          />
          <span className="text-3xl font-bold text-[#39ff14]">slimy.ai</span>
        </div>

        {/* 404 */}
        <h1 className="text-8xl font-bold text-[#00ffff] tracking-tighter drop-shadow-[0_0_20px_#00ffff]">
          404
        </h1>

        <p className="text-2xl text-[#8a4baf]">
          SIGNAL_LOST // PAGE_NOT_FOUND
        </p>

        <p className="text-[#d6b4fc] opacity-60 max-w-md">
          The neural pathway you requested does not exist in this dimension.
        </p>

        {/* Navigation links */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            href="/snail"
            className="px-6 py-3 border-2 border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14]/10 transition-colors font-bold tracking-widest"
          >
            GO TO HUB
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border-2 border-[#8a4baf] text-[#8a4baf] hover:bg-[#8a4baf]/10 transition-colors font-bold tracking-widest"
          >
            GO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
