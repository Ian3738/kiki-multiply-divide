"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import IdentityGate from "@/components/IdentityGate";

type View = {
  id: string;
  phase: "waiting" | "playing" | "done";
  you: "A" | "B";
  yourScore: number;
  opponentScore: number;
  opponentJoined: boolean;
  current: number;
  totalRounds: number;
  question: { q: string; options: string[]; answer: number };
  yourPick: number | null;
  yourRight: boolean | null;
  opponentPicked: boolean;
  opponentRight: boolean | null;
  roundLocked: boolean;
  winner: "A" | "B" | "draw" | null;
};

export default function RaceWrapper({ raceId }: { raceId: string }) {
  return (
    <IdentityGate>
      {(studentId) => <Room raceId={raceId} studentId={studentId} />}
    </IdentityGate>
  );
}

function Room({ raceId, studentId }: { raceId: string; studentId: string }) {
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState<string | null>(null);
  const advancing = useRef(false);

  const fetchView = useCallback(async () => {
    try {
      const r = await fetch(`/api/races/${raceId}?playerId=${encodeURIComponent(studentId)}`);
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${r.status}`);
      }
      const d = await r.json();
      setView(d.view);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [raceId, studentId]);

  useEffect(() => {
    fetchView();
    const t = setInterval(fetchView, 800);
    return () => clearInterval(t);
  }, [fetchView]);

  // 自動推進：如果輪鎖了 + 自己也答過 → 1.5 秒後推進到下一題（任一玩家觸發都行）
  useEffect(() => {
    if (!view) return;
    if (view.phase !== "playing") return;
    if (advancing.current) return;
    const shouldAdvance =
      view.roundLocked &&
      view.yourPick !== null;
    if (shouldAdvance) {
      advancing.current = true;
      const t = setTimeout(async () => {
        try {
          await fetch(`/api/races/${raceId}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ playerId: studentId, action: "advance" }),
          });
        } catch {}
        advancing.current = false;
        fetchView();
      }, 1500);
      return () => {
        clearTimeout(t);
        advancing.current = false;
      };
    }
  }, [view, raceId, studentId, fetchView]);

  async function submit(p: number) {
    if (!view) return;
    if (view.phase !== "playing") return;
    if (view.yourPick !== null) return;
    try {
      const r = await fetch(`/api/races/${raceId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerId: studentId, picked: p, action: "answer" }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${r.status}`);
      }
      const d = await r.json();
      setView(d.view);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-amber-50">
        <div className="text-center">
          <div className="text-rose-700 font-bold text-lg">{error}</div>
          <Link href="/race" className="mt-4 inline-block text-amber-700 underline">← 回速度賽大廳</Link>
        </div>
      </main>
    );
  }
  if (!view) {
    return <main className="min-h-screen flex items-center justify-center p-6 bg-amber-50"><div className="text-slate-500">載入中…</div></main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex flex-col">
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center gap-3 shadow">
        <Link href="/race" className="text-xs text-slate-400 hover:text-white">← 離開</Link>
        <div className="text-xs font-bold tracking-widest bg-amber-500 text-slate-900 px-2 py-1 rounded">房 {view.id}</div>
        <div className="flex-1 text-center text-sm">
          題 {Math.min(view.current + 1, view.totalRounds)} / {view.totalRounds}
        </div>
        <div className="text-sm">
          <span className="text-amber-300 font-bold">你 {view.yourScore}</span>
          <span className="mx-2">vs</span>
          <span className="text-emerald-300 font-bold">對手 {view.opponentScore}</span>
        </div>
      </header>

      {view.phase === "waiting" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-7xl mb-4">⏳</div>
          <div className="text-2xl font-bold">等待對手加入…</div>
          <div className="mt-3 text-slate-600">把這個 4 字代碼傳給朋友：</div>
          <div className="mt-4 text-6xl font-mono font-black bg-white border-4 border-amber-400 rounded-2xl px-8 py-4 inline-block shadow-lg">
            {view.id}
          </div>
        </div>
      )}

      {view.phase === "playing" && (
        <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8">
          <div className="w-full max-w-2xl">
            <div className="rounded-2xl bg-white border-4 border-slate-900 shadow-lg p-6 mb-5">
              <div className="text-base sm:text-lg font-bold whitespace-pre-wrap leading-relaxed">
                {view.question.q}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {view.question.options.map((opt, i) => {
                const idx1 = i + 1;
                const isPicked = view.yourPick === idx1;
                const isReveal = view.roundLocked && idx1 === view.question.answer;
                let bg = "bg-white border-slate-300 hover:border-amber-500";
                if (isReveal) bg = "bg-emerald-500 text-white border-emerald-700";
                else if (isPicked && view.yourRight === false) bg = "bg-rose-500 text-white border-rose-700";
                else if (view.yourPick !== null) bg = "bg-white border-slate-200 opacity-60";
                return (
                  <button
                    key={i}
                    onClick={() => submit(idx1)}
                    disabled={view.yourPick !== null}
                    className={`text-left p-4 rounded-xl border-4 font-bold text-base transition active:scale-95 ${bg}`}
                  >
                    <span className="inline-flex w-8 h-8 mr-3 rounded bg-amber-300 text-amber-900 text-center font-bold leading-8 justify-center items-center">
                      {String.fromCharCode(64 + idx1)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {view.roundLocked && (
              <div className="mt-4 text-center text-lg font-bold">
                {view.yourRight ? (
                  <span className="text-emerald-700">你先答對！+1 分</span>
                ) : view.opponentRight ? (
                  <span className="text-rose-700">對手先答對…</span>
                ) : (
                  <span className="text-slate-700">沒人答對</span>
                )}
                <div className="text-sm text-slate-500 mt-1">1.5 秒後進下一題…</div>
              </div>
            )}
          </div>
        </div>
      )}

      {view.phase === "done" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-7xl mb-4">
            {view.winner === "draw" ? "🤝" : view.winner === view.you ? "🏆" : "💀"}
          </div>
          <div className="text-4xl font-black text-slate-900">
            {view.winner === "draw" ? "DRAW" : view.winner === view.you ? "YOU WIN!" : "DEFEAT"}
          </div>
          <div className="mt-6 text-2xl font-bold">
            <span className="text-amber-700">你 {view.yourScore}</span>
            <span className="mx-3">vs</span>
            <span className="text-emerald-700">對手 {view.opponentScore}</span>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/race" className="rounded-lg bg-amber-600 hover:bg-amber-700 px-8 py-3 text-white font-bold">再戰一場</Link>
            <Link href="/" className="rounded-lg bg-slate-200 hover:bg-slate-300 px-8 py-3 text-slate-700 font-bold">回首頁</Link>
          </div>
        </div>
      )}
    </main>
  );
}
