"use client";

import { useEffect, useState } from "react";
import { loadStudent, saveStudent, Student, studentToId } from "@/lib/studentId";

type Props = {
  children: (id: string, student: Student) => React.ReactNode;
};

// 子元件接收 student id 作為 render prop，確保身分一定存在後才 mount。
export default function IdentityGate({ children }: Props) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStudent(loadStudent());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return <div className="py-12 text-center text-slate-500 font-medium">載入中…</div>;
  }

  if (!student) {
    return (
      <IdentityForm
        onSubmit={(s) => {
          saveStudent(s);
          setStudent(s);
        }}
      />
    );
  }

  return (
    <>
      <IdentityBadge student={student} onChange={() => setStudent(null)} />
      {children(studentToId(student), student)}
    </>
  );
}

function IdentityForm({ onSubmit }: { onSubmit: (s: Student) => void }) {
  const [classCode, setClassCode] = useState("");
  const [seatNo, setSeatNo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const c = classCode.trim();
    const n = parseInt(seatNo, 10);
    if (!c) return setError("請輸入班級");
    if (!Number.isFinite(n) || n < 1 || n > 99)
      return setError("座號要在 1~99 之間");
    onSubmit({ classCode: c, seatNo: n });
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border-2 border-slate-300/60 bg-white/95 backdrop-blur-sm p-6 sm:p-7 mt-6 shadow-2xl shadow-slate-900/10">
      <div className="flex items-center gap-3 mb-1">
        <div className="text-3xl">👋</div>
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">先告訴我你是誰</h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            用來統計你的答題成績
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-1 h-4 bg-blue-500 rounded" />
            班級
          </span>
          <input
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            placeholder="例如 701 或 七年一班"
            maxLength={20}
            className="mt-1.5 w-full rounded-xl border-2 border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition font-medium"
            autoFocus
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-1 h-4 bg-blue-500 rounded" />
            座號
          </span>
          <input
            type="number"
            min={1}
            max={99}
            value={seatNo}
            onChange={(e) => setSeatNo(e.target.value)}
            placeholder="1 ~ 99"
            className="mt-1.5 w-full rounded-xl border-2 border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition font-medium"
          />
        </label>
        {error && (
          <div className="rounded-xl bg-rose-50 border-2 border-rose-200 p-3 text-sm font-bold text-rose-800 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-3 text-white font-black shadow-lg shadow-blue-500/40 transition-all active:scale-95 hover:-translate-y-0.5"
        >
          ✓ 確認，開始玩
        </button>
      </form>
    </div>
  );
}

function IdentityBadge({
  student,
  onChange,
}: {
  student: Student;
  onChange: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2 rounded-xl bg-white/90 backdrop-blur-sm border-2 border-slate-200 px-4 py-2 text-sm shadow-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg">🎫</span>
        <div className="min-w-0">
          <div className="text-[10px] text-slate-500 leading-none font-semibold">目前身分</div>
          <div className="font-black text-slate-900 truncate">
            {student.classCode} · {String(student.seatNo).padStart(2, "0")} 號
          </div>
        </div>
      </div>
      <button
        onClick={onChange}
        className="flex-shrink-0 text-xs text-slate-700 hover:text-white hover:bg-rose-600 border border-slate-300 hover:border-rose-600 rounded-full px-3 py-1 font-bold transition"
      >
        換人
      </button>
    </div>
  );
}
