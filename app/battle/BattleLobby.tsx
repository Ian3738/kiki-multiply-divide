"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import IdentityGate from "@/components/IdentityGate";

export default function BattleLobbyWrapper() {
  return <IdentityGate>{(studentId) => <Lobby studentId={studentId} />}</IdentityGate>;
}

function Lobby({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createRoom() {
    setBusy("create");
    setError(null);
    try {
      const r = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerId: studentId }),
      });
      if (!r.ok) throw new Error("建房間失敗");
      const data = await r.json();
      router.push(`/battle/${data.roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  }

  function joinRoom() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 4) {
      setError("房間代碼是 4 個字");
      return;
    }
    setBusy("join");
    setError(null);
    router.push(`/battle/${trimmed}`);
  }

  return (
    <div className="space-y-4">
      {/* 開新房間 */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-rose-300/60 bg-gradient-to-br from-rose-50/95 to-pink-50/95 backdrop-blur-sm p-5 sm:p-6 shadow-xl shadow-rose-500/10">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-rose-300/20 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎮</span>
            <h2 className="font-black text-lg sm:text-xl text-rose-900">開新房間</h2>
          </div>
          <p className="text-xs sm:text-sm text-rose-800/80 font-medium">
            建立後拿到 <span className="font-bold">4 字代碼</span>，傳給朋友讓他加入
          </p>
          <button
            onClick={createRoom}
            disabled={busy !== null}
            className="mt-4 w-full sm:w-auto rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 px-6 py-3 text-white font-black shadow-lg shadow-rose-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 hover:-translate-y-0.5"
          >
            {busy === "create" ? "建立中…" : "✨ 建立房間"}
          </button>
        </div>
      </div>

      {/* 加入房間 */}
      <div className="rounded-2xl border-2 border-slate-300/60 bg-white/95 backdrop-blur-sm p-5 sm:p-6 shadow-xl shadow-slate-500/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🔗</span>
          <h2 className="font-black text-lg sm:text-xl text-slate-900">加入房間</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          輸入朋友給你的 4 字代碼
        </p>
        <div className="mt-4 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD"
            maxLength={4}
            className="flex-1 rounded-xl border-2 border-slate-300 px-4 py-3 font-mono text-2xl sm:text-3xl font-black uppercase tracking-[0.5em] text-center text-slate-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 outline-none transition"
          />
          <button
            onClick={joinRoom}
            disabled={busy !== null}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 sm:px-6 text-white font-black disabled:opacity-50 transition active:scale-95"
          >
            加入
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border-2 border-rose-200 p-3 text-sm font-bold text-rose-800 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}
    </div>
  );
}
