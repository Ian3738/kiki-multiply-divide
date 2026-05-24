import Link from "next/link";
import RaceLobby from "./RaceLobby";

export default function RaceIndex() {
  return (
    <main className="min-h-svh px-6 py-10 bg-gradient-to-br from-amber-50 to-yellow-50">
      <div className="max-w-xl mx-auto">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← 回首頁</Link>
        <h1 className="mt-4 text-3xl font-bold">⚡ 速度賽</h1>
        <p className="mt-2 text-slate-600">
          兩人看同一題搶答 10 題，先答對者得 1 分，最後分數高者勝。
        </p>
        <div className="mt-8">
          <RaceLobby />
        </div>
      </div>
    </main>
  );
}
