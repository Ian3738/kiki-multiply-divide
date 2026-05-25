import Link from "next/link";
import RaceLobby from "./RaceLobby";

export default function RaceIndex() {
  return (
    <main className="min-h-svh px-4 sm:px-6 py-6 sm:py-10 bg-gradient-to-br from-amber-50 to-yellow-50">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← 回首頁</Link>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <span>⚡</span>
          <span>速度賽</span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600">
          兩人看同一題搶答 10 題，先答對者得 1 分，最後分數高者勝。
        </p>
        <div className="mt-6 sm:mt-8">
          <RaceLobby />
        </div>
      </div>
    </main>
  );
}
