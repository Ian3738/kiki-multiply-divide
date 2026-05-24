import Link from "next/link";
import BattleLobby from "./BattleLobby";

export default function BattleIndex() {
  return (
    <main className="min-h-screen px-6 py-10 bg-gradient-to-br from-rose-50 to-pink-50">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← 回首頁</Link>
        <h1 className="mt-4 text-3xl font-bold">⚔️ 雙人對戰</h1>
        <p className="mt-2 text-slate-600">
          玩法：雙方各自獨立題目流，答對讓對方扣 15 HP、答錯自己扣 8 HP。
          先 KO 對方者勝。
        </p>
        <div className="mt-8">
          <BattleLobby />
        </div>
      </div>
    </main>
  );
}
