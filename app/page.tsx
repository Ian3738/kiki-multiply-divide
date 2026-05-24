import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <div className="max-w-3xl w-full text-center">
        <div className="inline-block px-4 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold tracking-widest mb-3">
          KIKI
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          乘除小達人
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          國小數學 · 康軒版乘除關係 · 155 題
          <br />
          一個人練習，或拉朋友一起 PK。
        </p>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <ModeCard
            href="/solo"
            emoji="🧘"
            title="單人練習"
            desc="自己挑戰 155 題，可選題數與隨機 / 依序。"
            color="emerald"
            cta="開始練習"
          />
          <ModeCard
            href="/battle"
            emoji="⚔️"
            title="雙人對戰"
            desc="建房間互拉朋友。各自答各自題目流，比速度扣對方 HP。"
            color="rose"
            cta="建房間"
          />
          <ModeCard
            href="/race"
            emoji="⚡"
            title="速度賽"
            desc="兩人同題搶答 10 題，誰先答對誰得分，勝場多者勝。"
            color="amber"
            cta="建房間"
          />
        </div>

        <p className="mt-10 text-xs text-slate-400">
          建議使用桌面瀏覽器或 iPad。對戰需要兩人各自開瀏覽器、用 4 字房間代碼配對。
        </p>
      </div>
    </main>
  );
}

function ModeCard({
  href,
  emoji,
  title,
  desc,
  color,
  cta,
}: {
  href: string;
  emoji: string;
  title: string;
  desc: string;
  color: "emerald" | "rose" | "amber";
  cta: string;
}) {
  const colors = {
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-200 hover:border-emerald-500",
      btn: "bg-emerald-600",
    },
    rose: {
      bg: "bg-rose-50",
      border: "border-rose-200 hover:border-rose-500",
      btn: "bg-rose-600",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200 hover:border-amber-500",
      btn: "bg-amber-600",
    },
  }[color];
  return (
    <Link
      href={href}
      className={`group rounded-xl border-2 ${colors.bg} ${colors.border} p-6 text-left transition flex flex-col`}
    >
      <div className="text-4xl mb-3">{emoji}</div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600 flex-1">{desc}</p>
      <span
        className={`mt-4 self-start rounded-full ${colors.btn} px-4 py-1.5 text-white text-sm font-medium`}
      >
        {cta} →
      </span>
    </Link>
  );
}
