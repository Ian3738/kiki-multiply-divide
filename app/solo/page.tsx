"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

  if (phase === "setup") {
    return (
      <main className="min-h-svh px-6 py-10 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-xl mx-auto">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← 回首頁</Link>
          <h1 className="mt-4 text-3xl font-bold">🧘 單人練習</h1>
          <p className="mt-2 text-slate-600">康軒版國小數學乘除關係，總共 155 題。</p>

          <div className="mt-8 rounded-xl border-2 border-emerald-200 bg-white p-6 space-y-5">
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">題數</div>
              <div className="flex flex-wrap gap-2">
                {[10, 20, 30, 50, 155].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${
                      count === n
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400"
                    }`}
                  >
                    {n === 155 ? "全部 (155)" : n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">順序</div>
              <div className="flex gap-2">
                {(["shuffle", "ordered"] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => setOrder(o)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${
                      order === o
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400"
                    }`}
                  >
                    {o === "shuffle" ? "隨機" : "依序"}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={start}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-white font-medium"
            >
              開始作答
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "result") {
    const rate = Math.round((correct / questions.length) * 100);
    return (
      <main className="min-h-svh px-6 py-10 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-6xl mb-4">
            {rate === 100 ? "🏆" : rate >= 80 ? "🥇" : rate >= 60 ? "🥈" : rate >= 40 ? "🥉" : "💪"}
          </div>
          <h1 className="text-3xl font-bold">完成！</h1>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md mx-auto">
            <Stat label="答對" value={correct} color="emerald" />
            <Stat label="答錯" value={wrong} color="rose" />
            <Stat label="正確率" value={`${rate}%`} color="amber" />
          </div>
          <div className="mt-8 flex flex-col gap-3 max-w-md mx-auto">
            <button
              onClick={() => setPhase("setup")}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-white font-medium"
            >
              再玩一次
            </button>
            <Link href="/" className="rounded-lg bg-slate-200 hover:bg-slate-300 px-5 py-3 text-slate-700 font-medium text-center">
              回首頁
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // playing
  const q = questions[idx];
  return (
    <main className="min-h-svh px-4 py-6 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
          <button onClick={() => setPhase("setup")} className="hover:text-slate-900">← 退出</button>
          <span>{idx + 1} / {questions.length}</span>
          <span>
            <span className="text-emerald-600 font-bold">✓ {correct}</span>{" "}
            <span className="text-rose-600 font-bold">✗ {wrong}</span>
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${(idx / questions.length) * 100}%` }}
          />
        </div>

        <div className="rounded-xl border-2 border-emerald-200 bg-white p-5 mb-4">
          <div className="text-lg font-medium whitespace-pre-wrap leading-relaxed">{q.q}</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {q.options.map((opt, i) => {
            const idx1 = i + 1;
            const isCorrect = picked !== null && idx1 === q.answer;
            const isPickedWrong = picked === idx1 && idx1 !== q.answer;
            return (
              <button
                key={i}
                onClick={() => answer(idx1)}
                disabled={picked !== null}
                className={`text-left p-4 rounded-xl border-2 font-medium transition ${
                  isCorrect
                    ? "bg-emerald-500 text-white border-emerald-600"
                    : isPickedWrong
                    ? "bg-rose-500 text-white border-rose-600"
                    : picked !== null
                    ? "bg-white border-slate-200 opacity-60"
                    : "bg-white border-slate-200 hover:border-emerald-400 active:scale-95"
                }`}
              >
                <span className="inline-block w-7 h-7 mr-3 rounded bg-amber-200 text-amber-900 text-center font-bold leading-7">
                  {String.fromCharCode(64 + idx1)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="mt-5 flex flex-col items-center gap-3">
            <div className={`text-xl font-bold ${picked === q.answer ? "text-emerald-700" : "text-rose-700"}`}>
              {picked === q.answer ? "答對了！" : `答錯了。正解：${String.fromCharCode(64 + q.answer)}`}
            </div>
            <button
              onClick={nextQ}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-8 py-3 text-white font-medium"
            >
              {idx + 1 >= questions.length ? "看結果" : "下一題"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: "emerald" | "rose" | "amber" }) {
  const colors = {
    emerald: "bg-emerald-100 text-emerald-900",
    rose: "bg-rose-100 text-rose-900",
    amber: "bg-amber-100 text-amber-900",
  }[color];
  return (
    <div className={`rounded-lg p-4 ${colors}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}
