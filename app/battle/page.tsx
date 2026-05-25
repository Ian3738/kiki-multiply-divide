import Link from "next/link";
import BattleLobby from "./BattleLobby";

export default function BattleIndex() {
  return (
    <main className="min-h-svh px-4 sm:px-6 py-6 sm:py-10 bg-gradient-to-br from-rose-50 to-pink-50">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← 回首頁</Link>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <span>⚔️</span>
          <span>雙人對戰</span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600">
          玩法：雙方各自獨立題目流，答對讓對方扣 15 HP、答錯自己扣 8 HP。先 KO 對方者勝。
        </p>
        <div className="mt-6 sm:mt-8">
          <BattleLobby />
        </div>
      </div>
    </main>
  );
}
