import { BellRing } from "lucide-react";

export function TopRail() {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm transition-all duration-300">
      <div className="flex-1 flex items-center">
        {/* 나중에 검색바나 브레드크럼 등 추가 가능 */}
      </div>
      <div className="flex items-center gap-4">
        <button
          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors relative"
          aria-label="알림"
        >
          <BellRing size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shadow-inner">
          A
        </div>
      </div>
    </header>
  );
}