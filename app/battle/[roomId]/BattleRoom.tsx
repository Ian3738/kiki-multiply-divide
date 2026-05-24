"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import IdentityGate from "@/components/IdentityGate";

type View = {
  id: string;
  phase: "waiting" | "playing" | "done";
  you: "A" | "B";
  yourState: {
    hp: number;
    correct: number;
    wrong: number;
    currentQ: { q: string; options: string[]; answer: number };
    idx: number;
  };
  opponentState: { hp: number; correct: number; wrong: number; joined: boolean };
  winner: "A" | "B" | "draw" | null;
};

export default function BattleRoomWrapper({ roomId }: { roomId: string }) {
  return (
    <IdentityGate>
      {(studentId) => <Room roomId={roomId} studentId={studentId} />}
    </IdentityGate>
  );
}

function Room({ roomId, studentId }: { roomId: string; studentId: string }) {
  const [view, setView] = useState<View | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"right" | "wrong" | null>(null);
  const lastIdx = useRef<number>(-1);

  const fetchView = useCallback(async () => {
    try {
      const r = await fetch(`/api/rooms/${roomId}?playerId=${encodeURIComponent(studentId)}`);
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${r.status}`);
      }
      const d = await r.json();
      setView(d.view);
      // 換題時清掉 picked / feedback
      if (d.view.yourState.idx !== lastIdx.current) {
        lastIdx.current = d.view.yourState.idx;
        setPicked(null);
        setFeedback(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [roomId, studentId]);

  // 初始 + polling
  useEffect(() => {
    fetchView();
    const t = setInterval(fetchView, 1500);
    return () => clearInterval(t);
  }, [fetchView]);

  async function submit(p: number) {
    if (picked !== null || !view) return;
    if (view.phase !== "playing") return;
    setPicked(p);
    try {
      const r = await fetch(`/api/rooms/${roomId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerId: studentId, picked: p }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${r.status}`);
      }
      const d = await r.json();
      setView(d.view);
      setFeedback(d.right ? "right" : "wrong");
      lastIdx.current = d.view.yourState.idx;
      // 1.2s 後清空 feedback 等下一題自動換掉
      setTimeout(() => {
        setPicked(null);
        setFeedback(null);
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPicked(null);
    }
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-rose-50">
        <div className="text-center">
          <div className="text-rose-700 font-bold text-lg">{error}</div>
          <Link href="/battle" className="mt-4 inline-block text-rose-700 underline">← 回對戰大廳</Link>
        </div>
      </main>
    );
  }
  if (!view) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-rose-50">
        <div className="text-slate-500">載入中…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex flex-col">
      {/* HUD */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center gap-3 shadow">
        <Link href="/battle" className="text-xs text-slate-400 hover:text-white">← 離開</Link>
        <div className="text-xs font-bold tracking-widest bg-rose-600 px-2 py-1 rounded">房 {view.id}</div>
        <div className="flex-1" />
        <div className="text-sm flex items-center gap-4">
          <PlayerBar label={`你 (${view.you})`} hp={view.yourState.hp} score={view.yourState.correct} color="amber" />
          <span className="text-xl">⚔️</span>
          <PlayerBar label={`對手${view.opponentState.joined ? "" : "（等待中）"}`} hp={view.opponentState.hp} score={view.opponentState.correct} color="emerald" />
        </div>
      </header>

      {view.phase === "waiting" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-7xl mb-4">⏳</div>
          <div className="text-2xl font-bold">等待對手加入…</div>
          <div className="mt-3 text-slate-600">把這個 4 字代碼傳給朋友：</div>
          <div className="mt-4 text-6xl font-mono font-black bg-white border-4 border-rose-400 rounded-2xl px-8 py-4 inline-block shadow-lg">
            {view.id}
          </div>
          <div className="mt-4 text-sm text-slate-500">
            朋友從 <span className="font-mono bg-slate-200 px-2 py-0.5 rounded">/battle</span> 點「加入房間」輸入此代碼
          </div>
        </div>
      )}

      {view.phase === "playing" && (
        <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8">
          <div className="w-full max-w-2xl">
            <div className="rounded-2xl bg-white border-4 border-slate-900 shadow-lg p-6 mb-5">
              <div className="text-base sm:text-lg font-bold whitespace-pre-wrap leading-relaxed">
                {view.yourState.currentQ.q}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {view.yourState.currentQ.options.map((opt, i) => {
                const idx1 = i + 1;
                const isPicked = picked === idx1;
                let bg = "bg-white border-slate-300 hover:border-rose-500";
                if (feedback && isPicked) {
                  bg = feedback === "right"
                    ? "bg-emerald-500 text-white border-emerald-700"
                    : "bg-rose-500 text-white border-rose-700";
                } else if (picked !== null) {
                  bg = "bg-white border-slate-200 opacity-60";
                }
                return (
                  <button
                    key={i}
                    onClick={() => submit(idx1)}
                    disabled={picked !== null}
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
            {feedback && (
              <div className={`mt-4 text-center text-lg font-bold ${feedback === "right" ? "text-emerald-700" : "text-rose-700"}`}>
                {feedback === "right" ? "答對！對手 -15 HP" : "答錯…自己 -8 HP"}
              </div>
            )}
            <div className="mt-3 text-center text-xs text-slate-500">
              已答 {view.yourState.idx} 題 · 答對 {view.yourState.correct} · 答錯 {view.yourState.wrong}
            </div>
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
          <div className="mt-6 flex gap-6">
            <ResultCol label="你" hp={view.yourState.hp} correct={view.yourState.correct} wrong={view.yourState.wrong} />
            <ResultCol label="對手" hp={view.opponentState.hp} correct={view.opponentState.correct} wrong={view.opponentState.wrong} />
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/battle" className="rounded-lg bg-rose-600 hover:bg-rose-700 px-8 py-3 text-white font-bold">再戰一場</Link>
            <Link href="/" className="rounded-lg bg-slate-200 hover:bg-slate-300 px-8 py-3 text-slate-700 font-bold">回首頁</Link>
          </div>
        </div>
      )}
    </main>
  );
}

function PlayerBar({ label, hp, score, color }: { label: string; hp: number; score: number; color: "amber" | "emerald" }) {
  const barColor = color === "amber" ? "from-amber-400 to-orange-500" : "from-emerald-400 to-teal-500";
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="text-xs">{label} · ✓{score}</div>
      <div className="w-28 sm:w-40 h-3 bg-slate-700 rounded overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${barColor} transition-all duration-500`} style={{ width: `${Math.max(0, hp)}%` }} />
      </div>
    </div>
  );
}

function ResultCol({ label, hp, correct, wrong }: { label: string; hp: number; correct: number; wrong: number }) {
  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 px-6 py-4">
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-black text-slate-900">HP {hp}</div>
      <div className="text-xs mt-1">
        <span className="text-emerald-600 font-bold">✓ {correct}</span>{" "}
        <span className="text-rose-600 font-bold">✗ {wrong}</span>
      </div>
    </div>
  );
}
