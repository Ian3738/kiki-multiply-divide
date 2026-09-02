"use client";

import Link from "next/link";
import { useState } from "react";
import { pickQuestions, type Question } from "@/lib/questions";

type Phase = "setup" | "playing" | "result";

export default function SoloPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [count, setCount] = useState(20);
  const [order, setOrder] = useState<"shuffle" | "ordered">("shuffle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  function start() {
    const qs = pickQuestions(count, order === "shuffle");
    setQuestions(qs);
    setIdx(0);
    setCorrect(0);
    setWrong(0);
    setPicked(null);
    setPhase("playing");
  }

  function answer(p: number) {
    if (picked !== null) return;
    setPicked(p);
    const q = questions[idx];
    if (p === q.answer) setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);
  }

  function nextQ() {
    if (idx + 1 >= questions.length) {
      setPhase("result");
    } else {
      setIdx(idx + 1);
      setPicked(null);
    }
  }

  // ============ SETUP ============
  if (phase === "setup") {
    return (
      <main className="relative min-h-svh px-4 sm:px-6 py-6 sm:py-10 overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        {/* 裝飾 */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-300/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-teal-300/30 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-emerald-700 font-medium">
            <span>←</span> 回首頁
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <div className="text-4xl sm:text-5xl">🧘</div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-br from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                單人練習
              </h1>
              <p className="text-xs sm:text-sm text-slate-700 font-medium mt-0.5">
                康軒版國小三年級下 · 乘除關係 · 155 題
              </p>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 rounded-2xl border-2 border-emerald-300/60 bg-white/80 backdrop-blur-sm p-5 sm:p-7 space-y-6 shadow-xl shadow-emerald-500/10">
            {/* 題數 */}
            <div>
              <div className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-emerald-500 rounded" />
                題數
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[10, 20, 30, 50, 155].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${
                      count === n
                        ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-emerald-700 shadow-md shadow-emerald-500/40 scale-105"
                        : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50"
                    }`}
                  >
                    {n === 155 ? "全部" : n}
                  </button>
                ))}
              </div>
            </div>

            {/* 順序 */}
            <div>
              <div className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-emerald-500 rounded" />
                出題順序
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["shuffle", "ordered"] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => setOrder(o)}
                    className={`px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${
                      order === o
                        ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-emerald-700 shadow-md shadow-emerald-500/40"
                        : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50"
                    }`}
                  >
                    {o === "shuffle" ? "🔀 隨機" : "📖 依序"}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={start}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-4 text-white font-black text-lg shadow-lg shadow-emerald-500/40 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            >
              🚀 開始作答
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ============ RESULT ============
  if (phase === "result") {
    const rate = Math.round((correct / questions.length) * 100);
    const medal = rate === 100 ? "🏆" : rate >= 80 ? "🥇" : rate >= 60 ? "🥈" : rate >= 40 ? "🥉" : "💪";
    const title = rate === 100 ? "滿分通關！" : rate >= 80 ? "表現亮眼！" : rate >= 60 ? "還不錯！" : rate >= 40 ? "繼續加油" : "再來一次";
    const rateColor = rate >= 80 ? "text-emerald-600" : rate >= 40 ? "text-amber-600" : "text-rose-600";

    return (
      <main className="relative min-h-svh px-4 sm:px-6 py-6 sm:py-10 overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -right-32 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-teal-300/30 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-xl mx-auto text-center pt-6">
          <div className="text-7xl sm:text-8xl mb-3 animate-[bounce_1s_ease-in-out]">{medal}</div>
          <h1 className={`text-3xl sm:text-4xl font-black ${rateColor}`}>{title}</h1>

          {/* 圓形進度環 */}
          <div className="mt-6 sm:mt-8 inline-flex items-center justify-center relative">
            <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
              <circle cx="90" cy="90" r="76" strokeWidth="14" fill="none" className="stroke-slate-200" />
              <circle
                cx="90"
                cy="90"
                r="76"
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(rate / 100) * 2 * Math.PI * 76} ${2 * Math.PI * 76}`}
                className="stroke-emerald-500 transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl sm:text-5xl font-black text-slate-900">{rate}%</div>
              <div className="text-xs text-slate-500 mt-1">正確率</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <Stat label="答對" value={correct} icon="✓" color="emerald" />
            <Stat label="答錯" value={wrong} icon="✗" color="rose" />
          </div>

          <div className="mt-8 flex flex-col gap-2.5 max-w-sm mx-auto">
            <button
              onClick={() => setPhase("setup")}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-3.5 text-white font-black shadow-lg shadow-emerald-500/40 active:scale-95 transition"
            >
              🔄 再玩一次
            </button>
            <Link
              href="/"
              className="rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 px-5 py-3.5 text-slate-700 font-bold text-center active:scale-95 transition"
            >
              回首頁
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ============ PLAYING ============
  const q = questions[idx];
  const isRight = picked !== null && picked === q.answer;
  const progressPct = (idx / questions.length) * 100;

  return (
    <main className="relative min-h-svh px-4 py-4 sm:px-6 sm:py-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-200/40 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            onClick={() => setPhase("setup")}
            className="text-xs sm:text-sm text-slate-600 hover:text-emerald-700 font-medium bg-white/70 backdrop-blur-sm border border-slate-200 rounded-full px-3 py-1"
          >
            ← 退出
          </button>
          <div className="text-sm font-black text-slate-800 bg-white/80 backdrop-blur-sm rounded-full px-4 py-1 border border-slate-200 shadow-sm">
            {idx + 1} <span className="text-slate-400">/</span> {questions.length}
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            <span className="text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">✓ {correct}</span>
            <span className="text-rose-600 flex items-center gap-0.5 bg-rose-50 px-2 py-1 rounded-full border border-rose-200">✗ {wrong}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-white/70 backdrop-blur-sm rounded-full overflow-hidden mb-5 border border-slate-200 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-all duration-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* 題卡 */}
        <div className="rounded-2xl border-2 border-emerald-300/60 bg-white/90 backdrop-blur-sm p-5 sm:p-6 mb-5 shadow-xl shadow-emerald-500/10">
          <div className="text-base sm:text-lg font-bold whitespace-pre-wrap leading-relaxed text-slate-900">
            {q.q}
          </div>
        </div>

        {/* 選項 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {q.options.map((opt, i) => {
            const idx1 = i + 1;
            const isCorrectAns = picked !== null && idx1 === q.answer;
            const isPickedWrong = picked === idx1 && idx1 !== q.answer;
            const clickable = picked === null;
            let stateClass = "";
            if (isCorrectAns) {
              stateClass = "bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-700 shadow-lg shadow-emerald-500/40 scale-[1.02]";
            } else if (isPickedWrong) {
              stateClass = "bg-gradient-to-br from-rose-500 to-pink-600 text-white border-rose-700 shadow-lg shadow-rose-500/40";
            } else if (picked !== null) {
              stateClass = "bg-white/80 border-slate-200 opacity-50";
            } else {
              stateClass = "bg-white border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]";
            }
            return (
              <button
                key={i}
                onClick={() => answer(idx1)}
                disabled={!clickable}
                className={`flex items-center gap-3 text-left p-4 sm:p-5 rounded-2xl border-2 font-bold transition-all duration-200 ${stateClass}`}
              >
                <span
                  className={`flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl font-black text-lg ${
                    isCorrectAns || isPickedWrong
                      ? "bg-white/90 text-slate-900"
                      : "bg-gradient-to-br from-amber-300 to-orange-400 text-amber-900 shadow-md"
                  }`}
                >
                  {String.fromCharCode(64 + idx1)}
                </span>
                <span className="text-base flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="mt-6 flex flex-col items-center gap-4 animate-[slideUp_0.3s_ease]">
            <div
              className={`px-6 py-3 rounded-full text-xl font-black shadow-lg ${
                isRight
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/40"
                  : "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-500/40"
              }`}
            >
              {isRight ? "🎉 答對了！" : `😅 正解：${String.fromCharCode(64 + q.answer)}`}
            </div>
            <button
              onClick={nextQ}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-10 py-3.5 text-white font-black shadow-lg shadow-emerald-500/40 active:scale-95 transition"
            >
              {idx + 1 >= questions.length ? "看結果 →" : "下一題 →"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}

function Stat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: "emerald" | "rose";
}) {
  const themes = {
    emerald: "bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-300 text-emerald-900",
    rose: "bg-gradient-to-br from-rose-100 to-pink-100 border-rose-300 text-rose-900",
  }[color];
  return (
    <div className={`rounded-2xl border-2 ${themes} p-4 shadow-md`}>
      <div className="text-2xl mb-0.5">{icon}</div>
      <div className="text-3xl font-black">{value}</div>
      <div className="text-xs font-semibold mt-0.5 opacity-80">{label}</div>
    </div>
  );
}
