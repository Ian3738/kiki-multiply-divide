import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-svh flex flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* 裝飾：浮動幾何色塊 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-amber-300/30 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-rose-300/30 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite_2s]" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-emerald-300/30 rounded-full blur-3xl animate-[float_9s_ease-in-out_infinite_4s]" />
      </div>

      <div className="relative max-w-4xl w-full text-center">
        {/* Hero */}
        <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-slate-200/60 text-[11px] font-semibold text-slate-600 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          國小三年級下 · 乘除關係
        </div>
        <h1 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">
          乘除小達人
        </h1>
        <p className="mt-4 text-sm sm:text-lg text-slate-700 font-medium">
          155 題康軒題庫 · 一個人練習，或拉朋友一起 PK
        </p>

        {/* 3 個 Mode Card — 統一大小、glassmorphism */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <ModeCard
            href="/solo"
            emoji="🧘"
            title="單人練習"
            desc="10~155 題自由挑戰"
            hint="隨機或依序作答"
            color="emerald"
            cta="開始練習"
          />
          <ModeCard
            href="/battle"
            emoji="⚔️"
            title="雙人對戰"
            desc="4 字代碼跨裝置 PK"
            hint="答對扣對方 HP，先 KO 者勝"
            color="rose"
            cta="建立房間"
          />
          <ModeCard
            href="/race"
            emoji="⚡"
            title="速度賽"
            desc="10 題同題搶答"
            hint="先答對得分，分數高者勝"
            color="amber"
            cta="建立房間"
          />
        </div>

        <p className="mt-8 sm:mt-10 text-xs text-slate-500">
          🖥️ 電腦 / 📱 iPad 皆可 · 對戰請兩人各自開瀏覽器，用 4 字房間代碼配對
        </p>

        {/* 版權致謝 */}
        <footer className="mt-8 sm:mt-10 pt-6 border-t border-slate-300/40 text-xs text-slate-600 leading-relaxed">
          <div className="font-bold text-slate-800 mb-2 flex items-center justify-center gap-1.5">
            <span className="text-amber-500">✦</span>
            資料來源與致謝
            <span className="text-amber-500">✦</span>
          </div>
          <ul className="space-y-1">
            <li>· 題庫來源：康軒版國小三年級下學期數學「乘除關係」單元</li>
            <li>· 對戰玩法靈感：原版 DD2P_Share8C_2017</li>
            <li>· 特別感謝：桃園市東興國中 鍾元杰 老師</li>
          </ul>
          <div className="mt-3 text-slate-500">
            © 2026 · 教育用途 · 題目選項由系統自動產生用於遊戲化練習
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.05); }
        }
      `}</style>
    </main>
  );
}

function ModeCard({
  href,
  emoji,
  title,
  desc,
  hint,
  color,
  cta,
}: {
  href: string;
  emoji: string;
  title: string;
  desc: string;
  hint: string;
  color: "emerald" | "rose" | "amber";
  cta: string;
}) {
  const themes = {
    emerald: {
      cardBg: "bg-gradient-to-br from-emerald-50/90 to-teal-50/90",
      border: "border-emerald-300/60 hover:border-emerald-500",
      titleColor: "text-emerald-900",
      accent: "text-emerald-700",
      cta: "bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 shadow-emerald-500/30",
      ring: "group-hover:ring-emerald-300/50",
    },
    rose: {
      cardBg: "bg-gradient-to-br from-rose-50/90 to-pink-50/90",
      border: "border-rose-300/60 hover:border-rose-500",
      titleColor: "text-rose-900",
      accent: "text-rose-700",
      cta: "bg-gradient-to-r from-rose-600 to-pink-600 group-hover:from-rose-500 group-hover:to-pink-500 shadow-rose-500/30",
      ring: "group-hover:ring-rose-300/50",
    },
    amber: {
      cardBg: "bg-gradient-to-br from-amber-50/90 to-yellow-50/90",
      border: "border-amber-300/60 hover:border-amber-500",
      titleColor: "text-amber-900",
      accent: "text-amber-700",
      cta: "bg-gradient-to-r from-amber-600 to-orange-600 group-hover:from-amber-500 group-hover:to-orange-500 shadow-amber-500/30",
      ring: "group-hover:ring-amber-300/50",
    },
  }[color];

  return (
    <Link
      href={href}
      className={`group relative flex flex-col rounded-2xl border-2 ${themes.cardBg} ${themes.border} backdrop-blur-sm p-5 sm:p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ring-4 ring-transparent ${themes.ring} shadow-lg`}
    >
      {/* Emoji + Title */}
      <div className="flex sm:block items-center gap-3">
        <div className="text-4xl sm:text-5xl sm:mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
          {emoji}
        </div>
        <h2 className={`text-xl sm:text-2xl font-black ${themes.titleColor}`}>{title}</h2>
      </div>

      {/* Desc */}
      <p className={`mt-2 text-sm sm:text-base font-semibold ${themes.accent}`}>{desc}</p>
      <p className="mt-1 text-xs text-slate-600 flex-1">{hint}</p>

      {/* CTA */}
      <span
        className={`mt-4 self-start inline-flex items-center gap-1 rounded-full ${themes.cta} px-5 py-2 text-white text-sm font-bold shadow-lg transition-all duration-300 group-hover:scale-105`}
      >
        {cta}
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}
