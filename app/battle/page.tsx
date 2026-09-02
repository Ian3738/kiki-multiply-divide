import Link from "next/link";
import BattleLobby from "./BattleLobby";

export default function BattleIndex() {
  return (
    <main className="relative min-h-svh px-4 sm:px-6 py-6 sm:py-10 overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-red-50">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-rose-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-rose-700 font-medium">
          <span>←</span> 回首頁
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="text-4xl sm:text-5xl">⚔️</div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-br from-rose-700 to-pink-700 bg-clip-text text-transparent">
              雙人對戰
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 font-medium mt-0.5">
              各自獨立題目流 · 答對讓對方 −15 HP · 先 KO 者勝
            </p>
          </div>
        </div>
        <div className="mt-6 sm:mt-8">
          <BattleLobby />
        </div>
      </div>
    </main>
  );
}
