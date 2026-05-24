"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import IdentityGate from "@/components/IdentityGate";
import { useBGM } from "@/lib/useBGM";

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
  const [oppCheerKey, setOppCheerKey] = useState(0);
  const [youCheerKey, setYouCheerKey] = useState(0);
  const advancing = useRef(false);
  const lastOppScore = useRef(0);
  const lastYouScore = useRef(0);

  const fetchView = useCallback(async () => {
    try {
      const r = await fetch(`/api/races/${raceId}?playerId=${encodeURIComponent(studentId)}`);
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${r.status}`);
      }
      const d = await r.json();
      const v = d.view as View;
      // 得分 → 角色彈跳
      if (v.yourScore > lastYouScore.current) {
        setYouCheerKey((k) => k + 1);
        lastYouScore.current = v.yourScore;
      }
      if (v.opponentScore > lastOppScore.current) {
        setOppCheerKey((k) => k + 1);
        lastOppScore.current = v.opponentScore;
      }
      setView(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [raceId, studentId]);

  useEffect(() => {
    fetchView();
    const t = setInterval(fetchView, 800);
    return () => clearInterval(t);
  }, [fetchView]);

  // BGM (gapless loop via Web Audio API)
  const [muted, setMuted] = useState(false);
  useBGM("/audio/pixel-clash.m4a", view?.phase === "playing", muted, 0.4);

  useEffect(() => {
    if (!view) return;
    if (view.phase !== "playing") return;
    if (advancing.current) return;
    if (view.roundLocked && view.yourPick !== null) {
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
      if (d.firstCorrect) {
        setYouCheerKey((k) => k + 1);
        lastYouScore.current = d.view.yourScore;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (error) {
    return (
      <main className="min-h-svh flex items-center justify-center p-6 bg-amber-50">
        <div className="text-center">
          <div className="text-rose-700 font-bold text-lg">{error}</div>
          <Link href="/race" className="mt-4 inline-block text-amber-700 underline">← 回速度賽大廳</Link>
        </div>
      </main>
    );
  }
  if (!view) {
    return <main className="min-h-svh flex items-center justify-center p-6 bg-amber-50"><div className="text-slate-500">載入中…</div></main>;
  }

  const youWin = view.phase === "done" && view.winner === view.you;
  const oppWin = view.phase === "done" && view.winner !== null && view.winner !== "draw" && view.winner !== view.you;
  // A 玩家永遠是紅機甲，B 玩家永遠是綠武術家
  const yourSprite = view.you === "A" ? "/sprites/fighter-p1.png" : "/sprites/fighter-p2.png";
  const oppSprite = view.you === "A" ? "/sprites/fighter-p2.png" : "/sprites/fighter-p1.png";

  return (
    <main className="min-h-svh bg-gradient-to-br from-amber-50 to-yellow-50 flex flex-col">
      {/* 頂部 SF2 風 HUD */}
      <header className="relative bg-gradient-to-b from-blue-700 to-blue-900 border-b-[3px] border-black px-3 py-2 flex items-center gap-2 shadow-[0_4px_0_rgba(0,0,0,0.5)] z-10">
        <Link
          href="/race"
          className="w-7 h-7 flex items-center justify-center bg-amber-500 text-slate-900 font-black text-sm border-2 border-black rounded shadow-[0_2px_0_#000] hover:bg-amber-400"
        >
          ✕
        </Link>
        <div className="bg-amber-500 text-slate-900 px-3 py-1 font-black text-xs tracking-[0.15em] border-2 border-black rounded">
          速度賽
        </div>
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "開啟音樂" : "靜音"}
          title={muted ? "開啟音樂" : "靜音"}
          className="w-7 h-7 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm border-2 border-black rounded shadow-[0_2px_0_#000]"
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <div className="flex-1 text-center text-white font-black text-sm [text-shadow:_2px_2px_0_#000]">
          題 {Math.min(view.current + 1, view.totalRounds)} / {view.totalRounds}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-300 font-black text-sm tracking-wider [text-shadow:_2px_2px_0_#000]">你</span>
          <ScorePill score={view.yourScore} color="amber" />
          <span className="text-white/70 text-lg">⚔️</span>
          <ScorePill score={view.opponentScore} color="emerald" />
          <span className="text-emerald-300 font-black text-sm tracking-wider [text-shadow:_2px_2px_0_#000]">
            對手{view.opponentJoined ? "" : "（等）"}
          </span>
        </div>
      </header>

      {/* 中央格鬥場景：全寬橫幅 banner */}
      <div
        className="relative w-full overflow-hidden border-b-[3px] border-black bg-[#1e1450]"
        style={{ height: "min(38dvh, 320px)", minHeight: "170px" }}
      >
        <Image src="/sprites/background.png" alt="" fill priority className="object-cover object-bottom" />
        {/* 你 */}
        <div
          key={`you-${youCheerKey}`}
          className={`absolute bottom-1 left-[6%] h-[92%] aspect-[893/1600] z-10 ${
            youCheerKey ? "animate-[victory_0.6s]" : ""
          }`}
          style={{
            transformOrigin: "50% 100%",
            transform: oppWin ? "rotate(-85deg) translate(-30px,10px)" : undefined,
            filter: oppWin ? "grayscale(0.3) brightness(0.85)" : undefined,
          }}
        >
          <Image
            src={yourSprite}
            alt="你"
            fill
            priority
            className="object-contain object-bottom drop-shadow-[3px_4px_0_rgba(0,0,0,0.45)]"
          />
        </div>
        {/* 對手 */}
        <div
          key={`opp-${oppCheerKey}`}
          className={`absolute bottom-1 right-[6%] h-[92%] aspect-[893/1600] z-10 ${
            oppCheerKey ? "animate-[victory-mirror_0.6s]" : ""
          }`}
          style={{
            transformOrigin: "50% 100%",
            transform: youWin
              ? "scaleX(-1) rotate(-85deg) translate(-30px,10px)"
              : "scaleX(-1)",
            filter: youWin ? "grayscale(0.3) brightness(0.85)" : undefined,
          }}
        >
          <Image
            src={oppSprite}
            alt="對手"
            fill
            priority
            className="object-contain object-bottom drop-shadow-[3px_4px_0_rgba(0,0,0,0.45)]"
          />
        </div>
      </div>

      {/* 下方答題 / 等待 / 結算 */}
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
        <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6">
          <div className="w-full max-w-2xl">
            <div className="rounded-2xl bg-white border-4 border-slate-900 shadow-lg p-5 mb-4">
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
          <div className="text-7xl mb-2">
            {view.winner === "draw" ? "🤝" : view.winner === view.you ? "🏆" : "💀"}
          </div>
          <div className="text-4xl font-black text-slate-900 [text-shadow:_3px_3px_0_#ffd60a]">
            {view.winner === "draw" ? "DRAW" : view.winner === view.you ? "YOU WIN!" : "DEFEAT"}
          </div>
          <div className="mt-6 text-2xl font-bold">
            <span className="text-amber-700">你 {view.yourScore}</span>
            <span className="mx-3">vs</span>
            <span className="text-emerald-700">對手 {view.opponentScore}</span>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={async () => {
                try {
                  await fetch(`/api/races/${raceId}`, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ playerId: studentId, action: "rematch" }),
                  });
                  lastYouScore.current = 0;
                  lastOppScore.current = 0;
                  advancing.current = false;
                  await fetchView();
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              }}
              className="rounded-lg bg-amber-600 hover:bg-amber-700 px-8 py-3 text-white font-bold"
            >
              再戰一場
            </button>
            <Link href="/race" className="rounded-lg bg-slate-300 hover:bg-slate-400 px-8 py-3 text-slate-800 font-bold">離開房間</Link>
            <Link href="/" className="rounded-lg bg-slate-200 hover:bg-slate-300 px-8 py-3 text-slate-700 font-bold">回首頁</Link>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes victory {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.1); }
        }
        @keyframes victory-mirror {
          0%, 100% { transform: scaleX(-1) translateY(0); }
          50% { transform: scaleX(-1) translateY(-20px); }
        }
      `}</style>
    </main>
  );
}

function ScorePill({ score, color }: { score: number; color: "amber" | "emerald" }) {
  const bg = color === "amber" ? "bg-amber-400 text-amber-900" : "bg-emerald-400 text-emerald-900";
  return (
    <div className={`${bg} border-2 border-black rounded-md px-2 py-0.5 font-black text-sm shadow-[0_2px_0_#000] min-w-[28px] text-center`}>
      {score}
    </div>
  );
}
