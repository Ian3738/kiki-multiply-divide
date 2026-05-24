"use client";

import Image from "next/image";
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

const KO_LINES = ["SOMEBODY CALL 119 PLEASE…", "我…我輸了…", "不可能…"];
const WIN_LINES = ["GG!", "哈哈哈！", "勝負已定！"];

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
  const [hitText, setHitText] = useState<{ side: "you" | "opp"; text: string } | null>(null);
  const [hurtSide, setHurtSide] = useState<"you" | "opp" | null>(null);
  // 角色動作：'punch' 衝刺出拳 | 'shoryuken' 升龍拳 | 'flying-kick' 飛踢 | null
  const [youAction, setYouAction] = useState<{ type: string; key: number } | null>(null);
  const [oppAction, setOppAction] = useState<{ type: string; key: number } | null>(null);
  // 波動拳能量球：from 哪一邊發射、命中動畫 key
  const [wave, setWave] = useState<{ from: "you" | "opp"; key: number; type: "wave" | "fireball" } | null>(null);
  // 大招橫幅
  const [specialBanner, setSpecialBanner] = useState<{ text: string; key: number } | null>(null);
  // 連對 counter
  const streak = useRef<number>(0);
  const oppStreak = useRef<number>(0);
  const lastIdx = useRef<number>(-1);
  const lastOppHp = useRef<number>(100);
  const lastOppCorrect = useRef<number>(0);

  const fetchView = useCallback(async () => {
    try {
      const r = await fetch(`/api/rooms/${roomId}?playerId=${encodeURIComponent(studentId)}`);
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${r.status}`);
      }
      const d = await r.json();
      const v = d.view as View;
      // 對手有進步：可能他答對打到你（你 HP 下降）
      if (v.yourState.hp < (view?.yourState.hp ?? 100)) {
        // 對手對我發動攻擊（從 polling 偵測）
        oppStreak.current++;
        triggerOppAttack(oppStreak.current);
      }
      // 對手答錯（correct 沒變但 wrong+1）→ 不影響我
      if (v.opponentState.correct > lastOppCorrect.current) {
        // 對手答對—可能已 polling 處理過了
      }
      lastOppCorrect.current = v.opponentState.correct;
      lastOppHp.current = v.opponentState.hp;
      setView(v);
      if (v.yourState.idx !== lastIdx.current) {
        lastIdx.current = v.yourState.idx;
        setPicked(null);
        setFeedback(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, studentId]);

  // 你發動攻擊（連擊越多招式越強）
  function triggerYourAttack(s: number) {
    let type = "punch";
    let waveType: "wave" | "fireball" = "wave";
    let banner: string | null = null;
    if (s >= 5) {
      type = "shoryuken";
      waveType = "fireball";
      banner = "SHORYUKEN!";
    } else if (s >= 3) {
      type = "flying-kick";
      waveType = "fireball";
      banner = "HADOUKEN!";
    }
    setYouAction({ type, key: Date.now() });
    setWave({ from: "you", key: Date.now(), type: waveType });
    if (banner) setSpecialBanner({ text: banner, key: Date.now() });

    setHitText({ side: "opp", text: type === "shoryuken" ? "K.O!?" : type === "flying-kick" ? "BOOM!" : "POW!" });
    setHurtSide("opp");
    setTimeout(() => setHurtSide(null), 600);
    setTimeout(() => setHitText(null), 800);
    setTimeout(() => setYouAction(null), 800);
    setTimeout(() => setWave(null), 800);
    if (banner) setTimeout(() => setSpecialBanner(null), 1200);
  }
  function triggerOppAttack(s: number) {
    let type = "punch";
    let waveType: "wave" | "fireball" = "wave";
    if (s >= 3) {
      type = "flying-kick";
      waveType = "fireball";
    }
    setOppAction({ type, key: Date.now() });
    setWave({ from: "opp", key: Date.now(), type: waveType });
    setHitText({ side: "you", text: "OUCH!" });
    setHurtSide("you");
    setTimeout(() => setHurtSide(null), 600);
    setTimeout(() => setHitText(null), 800);
    setTimeout(() => setOppAction(null), 800);
    setTimeout(() => setWave(null), 800);
  }

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
      const v = d.view as View;
      setView(v);
      setFeedback(d.right ? "right" : "wrong");
      lastIdx.current = v.yourState.idx;
      if (d.right) {
        streak.current++;
        triggerYourAttack(streak.current);
      } else {
        streak.current = 0; // 連對中斷
        setHitText({ side: "you", text: "OUCH!" });
        setHurtSide("you");
        setYouAction({ type: "stagger", key: Date.now() });
        setTimeout(() => setHurtSide(null), 600);
        setTimeout(() => setHitText(null), 700);
        setTimeout(() => setYouAction(null), 500);
      }
      lastOppHp.current = v.opponentState.hp;
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
    return <main className="min-h-screen flex items-center justify-center p-6 bg-rose-50"><div className="text-slate-500">載入中…</div></main>;
  }

  const youDown = view.phase === "done" && view.winner !== null && view.winner !== "draw" && view.winner !== view.you;
  const oppDown = view.phase === "done" && view.winner !== null && view.winner !== "draw" && view.winner === view.you;
  // A 玩家永遠是紅機甲；B 玩家永遠是綠武術家。對手用另一個角色。
  const yourSprite = view.you === "A" ? "/sprites/fighter-p1.png" : "/sprites/fighter-p2.png";
  const oppSprite = view.you === "A" ? "/sprites/fighter-p2.png" : "/sprites/fighter-p1.png";
  const yourLabel = view.you === "A" ? "紅機甲" : "綠武者";
  const oppLabel = view.you === "A" ? "綠武者" : "紅機甲";

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex flex-col">
      {/* 頂部 SF2 風 HUD */}
      <header className="relative bg-gradient-to-b from-blue-700 to-blue-900 border-b-[3px] border-black px-3 py-2 flex items-center gap-2 shadow-[0_4px_0_rgba(0,0,0,0.5)] z-10">
        <Link
          href="/battle"
          className="w-7 h-7 flex items-center justify-center bg-rose-600 text-white font-black text-sm border-2 border-black rounded shadow-[0_2px_0_#000] hover:bg-rose-700"
        >
          ✕
        </Link>
        <div className="bg-rose-600 text-white px-3 py-1 font-black text-xs tracking-[0.15em] border-2 border-black rounded">
          賽程表
        </div>
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className="text-yellow-300 font-black text-sm tracking-wider [text-shadow:_2px_2px_0_#000]">你 {yourLabel}</span>
          <div className="text-xs text-white/70 [text-shadow:_1px_1px_0_#000]">✓{view.yourState.correct}</div>
          <div className="w-32 sm:w-48 h-4 bg-[#4b0d12] border-2 border-black rounded-sm overflow-hidden shadow-inner">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.max(0, view.yourState.hp)}%`,
                background: "repeating-linear-gradient(90deg, #ff4444 0, #ff4444 6px, #ff8800 6px, #ff8800 12px)",
                marginLeft: "auto",
              }}
            />
          </div>
        </div>
        <div className="text-2xl px-2 animate-pulse">⚔️</div>
        <div className="flex-1 flex items-center gap-2">
          <div className="w-32 sm:w-48 h-4 bg-[#4b0d12] border-2 border-black rounded-sm overflow-hidden shadow-inner">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.max(0, view.opponentState.hp)}%`,
                background: "repeating-linear-gradient(90deg, #ffcc00 0, #ffcc00 6px, #ff8800 6px, #ff8800 12px)",
              }}
            />
          </div>
          <div className="text-xs text-white/70 [text-shadow:_1px_1px_0_#000]">✓{view.opponentState.correct}</div>
          <span className="text-emerald-300 font-black text-sm tracking-wider [text-shadow:_2px_2px_0_#000]">
            {oppLabel}{view.opponentState.joined ? "" : "（等）"}
          </span>
        </div>
      </header>

      {/* 中央格鬥場景：全寬橫幅 banner，固定 max-height */}
      <div
        className="relative w-full overflow-hidden border-b-[3px] border-black bg-[#1e1450]"
        style={{ height: "min(40vh, 360px)", minHeight: "180px" }}
      >
        <Image
          src="/sprites/background.png"
          alt=""
          fill
          priority
          className="object-cover object-bottom"
        />
        {/* 你 (P1 紅機甲) */}
        <div
          key={`you-${youAction?.key ?? "idle"}-${hurtSide === "you" ? "hurt" : ""}`}
          className={`absolute bottom-0 left-[8%] h-[90%] aspect-[893/1600] z-10 ${
            youAction?.type === "punch" ? "animate-[punch-right_0.6s_ease-out]" :
            youAction?.type === "flying-kick" ? "animate-[flying-kick-right_0.7s_ease-out]" :
            youAction?.type === "shoryuken" ? "animate-[shoryuken_0.8s_ease-out]" :
            youAction?.type === "stagger" ? "animate-[stagger_0.5s_ease-out]" :
            hurtSide === "you" ? "animate-[shake_0.5s]" : ""
          }`}
          style={{
            transformOrigin: "50% 100%",
            transform: youDown ? "rotate(-85deg) translate(-30px,10px)" : undefined,
            filter: youDown ? "grayscale(0.3) brightness(0.85)" : undefined,
          }}
        >
          <Image
            src={yourSprite}
            alt={`你 - ${yourLabel}`}
            fill
            priority
            className="object-contain object-bottom drop-shadow-[3px_4px_0_rgba(0,0,0,0.45)]"
          />
        </div>
        {/* 對手 (右側，鏡像) */}
        <div
          key={`opp-${oppAction?.key ?? "idle"}-${hurtSide === "opp" ? "hurt" : ""}`}
          className={`absolute bottom-0 right-[8%] h-[90%] aspect-[893/1600] z-10 ${
            oppAction?.type === "punch" ? "animate-[punch-left-mirror_0.6s_ease-out]" :
            oppAction?.type === "flying-kick" ? "animate-[flying-kick-left-mirror_0.7s_ease-out]" :
            hurtSide === "opp" ? "animate-[shake-mirror_0.5s]" : ""
          }`}
          style={{
            transformOrigin: "50% 100%",
            transform: oppDown
              ? "scaleX(-1) rotate(-85deg) translate(-30px,10px)"
              : "scaleX(-1)",
            filter: oppDown ? "grayscale(0.3) brightness(0.85)" : undefined,
          }}
        >
          <Image
            src={oppSprite}
            alt={`對手 - ${oppLabel}`}
            fill
            priority
            className="object-contain object-bottom drop-shadow-[3px_4px_0_rgba(0,0,0,0.45)]"
          />
        </div>

        {/* === 波動拳能量球 === */}
        {wave && (
          <div
            key={`wave-${wave.key}`}
            className={`absolute pointer-events-none z-15 ${
              wave.from === "you"
                ? "animate-[wave-fly-right_0.6s_ease-out]"
                : "animate-[wave-fly-left_0.6s_ease-out]"
            }`}
            style={{
              top: "55%",
              left: wave.from === "you" ? "18%" : undefined,
              right: wave.from === "opp" ? "18%" : undefined,
              width: wave.type === "fireball" ? "90px" : "60px",
              height: wave.type === "fireball" ? "90px" : "60px",
              transform: "translateY(-50%)",
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                // 波動拳顏色 = 發射者的角色屬性（紅機甲 → 橘紅火球；綠武術家 → 綠能量球）
                background: (() => {
                  const senderIsMech = (wave.from === "you" && view.you === "A") || (wave.from === "opp" && view.you === "B");
                  return senderIsMech
                    ? "radial-gradient(circle, #fffacd 0%, #ffd60a 30%, #ff5722 60%, #b71c1c 100%)"
                    : "radial-gradient(circle, #e0ffe0 0%, #66ff66 30%, #00c853 60%, #1b5e20 100%)";
                })(),
                boxShadow: (() => {
                  const senderIsMech = (wave.from === "you" && view.you === "A") || (wave.from === "opp" && view.you === "B");
                  return senderIsMech
                    ? "0 0 30px 10px rgba(255,140,0,0.7), 0 0 60px 20px rgba(255,87,34,0.4)"
                    : "0 0 30px 10px rgba(0,200,83,0.7), 0 0 60px 20px rgba(102,255,102,0.4)";
                })(),
              }}
            />
          </div>
        )}

        {/* === 大招橫幅 (HADOUKEN! / SHORYUKEN!) === */}
        {specialBanner && (
          <div
            key={`banner-${specialBanner.key}`}
            className="absolute top-[35%] left-1/2 z-30 pointer-events-none font-black italic animate-[banner-burst_1s_ease-out]"
            style={{
              fontSize: "clamp(40px, 6vw, 80px)",
              transform: "translateX(-50%) rotate(-6deg)",
              color: "#ffd60a",
              WebkitTextStroke: "5px #000",
              textShadow: "8px 8px 0 #c1272d, -3px -3px 0 #fff, 0 0 20px #ff8800",
              letterSpacing: "-3px",
              whiteSpace: "nowrap",
            }}
          >
            {specialBanner.text}
          </div>
        )}

        {/* === 攻擊特效層 === */}
        {hitText && (
          <>
            {/* 衝擊波光圈 */}
            <div
              className="absolute z-15 pointer-events-none animate-[shockwave_0.6s_ease-out]"
              style={{
                top: "50%",
                left: hitText.side === "you" ? "22%" : "auto",
                right: hitText.side === "opp" ? "22%" : "auto",
                transform: "translateY(-50%)",
                width: "120px",
                height: "120px",
              }}
            >
              <div className="absolute inset-0 border-[6px] border-yellow-300 rounded-full" />
            </div>
            {/* 星爆放射線 */}
            <div
              className="absolute z-15 pointer-events-none animate-[burst_0.5s_ease-out]"
              style={{
                top: "45%",
                left: hitText.side === "you" ? "20%" : "auto",
                right: hitText.side === "opp" ? "20%" : "auto",
                width: "160px",
                height: "160px",
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {[...Array(12)].map((_, i) => {
                  const a = (i * Math.PI * 2) / 12;
                  const x1 = 50 + Math.cos(a) * 18;
                  const y1 = 50 + Math.sin(a) * 18;
                  const x2 = 50 + Math.cos(a) * 48;
                  const y2 = 50 + Math.sin(a) * 48;
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#ffd60a"
                      strokeWidth="4"
                      strokeLinecap="round"
                      style={{ filter: "drop-shadow(0 0 4px #ff8800)" }}
                    />
                  );
                })}
              </svg>
            </div>
            {/* POW! / OUCH! 大字 */}
            <div
              className="absolute top-[20%] z-20 font-black italic pointer-events-none animate-[hit-pop_0.6s_ease]"
              style={{
                left: hitText.side === "you" ? "16%" : undefined,
                right: hitText.side === "opp" ? "16%" : undefined,
                fontSize: "clamp(40px, 7vw, 88px)",
                color: hitText.text === "POW!" ? "#ffd60a" : "#ff5252",
                WebkitTextStroke: "4px #000",
                textShadow: "6px 6px 0 #c1272d, -3px -3px 0 #fff",
                letterSpacing: "-3px",
                transform: "rotate(-8deg)",
              }}
            >
              {hitText.text}
            </div>
          </>
        )}
        {/* 全場閃光 (答對/答錯都有) */}
        {hitText && (
          <div
            className="absolute inset-0 z-5 pointer-events-none animate-[flash_0.25s_ease-out]"
            style={{
              background: hitText.text === "POW!"
                ? "radial-gradient(circle, rgba(255,214,10,0.6), transparent 60%)"
                : "radial-gradient(circle, rgba(255,82,82,0.5), transparent 60%)",
            }}
          />
        )}

        {oppDown && <Bubble side="opp">{KO_LINES[0]}</Bubble>}
        {youDown && <Bubble side="you">{KO_LINES[0]}</Bubble>}
        {oppDown && <Bubble side="you" win>{WIN_LINES[0]}</Bubble>}
        {youDown && <Bubble side="opp" win>{WIN_LINES[0]}</Bubble>}
      </div>

      {/* 下方答題 / 等待 / 結算 */}
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
        <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6">
          <div className="w-full max-w-2xl">
            <div className="rounded-2xl bg-white border-4 border-slate-900 shadow-lg p-5 mb-4">
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
              <div className={`mt-3 text-center text-lg font-bold ${feedback === "right" ? "text-emerald-700" : "text-rose-700"}`}>
                {feedback === "right" ? "答對！對手 −15 HP" : "答錯…自己 −8 HP"}
              </div>
            )}
            <div className="mt-2 text-center text-xs text-slate-500">
              已答 {view.yourState.idx} 題 · 答對 {view.yourState.correct} · 答錯 {view.yourState.wrong}
            </div>
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
          <div className="mt-6 flex gap-4">
            <ResultCol label="你" hp={view.yourState.hp} correct={view.yourState.correct} wrong={view.yourState.wrong} />
            <ResultCol label="對手" hp={view.opponentState.hp} correct={view.opponentState.correct} wrong={view.opponentState.wrong} />
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/battle" className="rounded-lg bg-rose-600 hover:bg-rose-700 px-8 py-3 text-white font-bold">再戰一場</Link>
            <Link href="/" className="rounded-lg bg-slate-200 hover:bg-slate-300 px-8 py-3 text-slate-700 font-bold">回首頁</Link>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); filter: brightness(1); }
          20% { transform: translateX(-12px); filter: brightness(2); }
          40% { transform: translateX(10px); filter: brightness(1.5); }
          60% { transform: translateX(-8px); filter: brightness(2); }
          80% { transform: translateX(6px); filter: brightness(1.3); }
        }
        @keyframes shake-mirror {
          0%, 100% { transform: scaleX(-1) translateX(0); filter: brightness(1); }
          20% { transform: scaleX(-1) translateX(-12px); filter: brightness(2); }
          40% { transform: scaleX(-1) translateX(10px); filter: brightness(1.5); }
          60% { transform: scaleX(-1) translateX(-8px); filter: brightness(2); }
          80% { transform: scaleX(-1) translateX(6px); filter: brightness(1.3); }
        }
        @keyframes hit-pop {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          40% { transform: scale(1.4) rotate(-12deg); opacity: 1; }
          100% { transform: scale(1) rotate(-8deg); opacity: 1; }
        }
        @keyframes shockwave {
          0% { transform: translateY(-50%) scale(0.2); opacity: 1; }
          100% { transform: translateY(-50%) scale(2.5); opacity: 0; }
        }
        @keyframes burst {
          0% { transform: scale(0.3) rotate(0deg); opacity: 1; }
          100% { transform: scale(1.6) rotate(40deg); opacity: 0; }
        }
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        /* === 角色攻擊招式 === */
        @keyframes punch-right {
          0% { transform: translateX(0); }
          15% { transform: translateX(-15px) scaleX(0.95); }  /* 蓄力後縮 */
          40% { transform: translateX(60px) scaleX(1.08); }   /* 衝刺出拳 */
          60% { transform: translateX(80px); }                /* 命中 */
          100% { transform: translateX(0); }                  /* 回原位 */
        }
        @keyframes punch-left-mirror {
          0% { transform: scaleX(-1) translateX(0); }
          15% { transform: scaleX(-1) translateX(-15px); }
          40% { transform: scaleX(-1) translateX(60px); }
          60% { transform: scaleX(-1) translateX(80px); }
          100% { transform: scaleX(-1) translateX(0); }
        }
        @keyframes flying-kick-right {
          0% { transform: translate(0, 0) rotate(0); }
          25% { transform: translate(-10px, -40px) rotate(-10deg); } /* 跳起 */
          55% { transform: translate(120px, -25px) rotate(15deg); }  /* 飛踢 */
          75% { transform: translate(140px, 0) rotate(0deg); }       /* 落地 */
          100% { transform: translate(0, 0) rotate(0); }
        }
        @keyframes flying-kick-left-mirror {
          0% { transform: scaleX(-1) translate(0, 0) rotate(0); }
          25% { transform: scaleX(-1) translate(-10px, -40px) rotate(-10deg); }
          55% { transform: scaleX(-1) translate(120px, -25px) rotate(15deg); }
          75% { transform: scaleX(-1) translate(140px, 0) rotate(0deg); }
          100% { transform: scaleX(-1) translate(0, 0) rotate(0); }
        }
        @keyframes shoryuken {
          0% { transform: translate(0, 0) rotate(0); }
          20% { transform: translate(0, 5px) scaleY(0.9); }      /* 蹲下蓄力 */
          50% { transform: translate(40px, -100px) rotate(-25deg); } /* 跳起 + 旋轉 */
          70% { transform: translate(60px, -70px) rotate(20deg); }
          100% { transform: translate(0, 0) rotate(0); }
        }
        @keyframes stagger {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-12px) scaleX(0.92); }
          50% { transform: translateX(-8px) scaleX(0.95); }
          75% { transform: translateX(-4px); }
        }
        /* 波動拳飛行 */
        @keyframes wave-fly-right {
          0% { opacity: 0; transform: translateY(-50%) translateX(0) scale(0.3); }
          15% { opacity: 1; transform: translateY(-50%) translateX(30px) scale(0.8); }
          100% { opacity: 0.9; transform: translateY(-50%) translateX(60vw) scale(1.3); }
        }
        @keyframes wave-fly-left {
          0% { opacity: 0; transform: translateY(-50%) translateX(0) scale(0.3); }
          15% { opacity: 1; transform: translateY(-50%) translateX(-30px) scale(0.8); }
          100% { opacity: 0.9; transform: translateY(-50%) translateX(-60vw) scale(1.3); }
        }
        @keyframes banner-burst {
          0% { transform: translateX(-50%) rotate(-25deg) scale(0); opacity: 0; }
          25% { transform: translateX(-50%) rotate(8deg) scale(1.4); opacity: 1; }
          50% { transform: translateX(-50%) rotate(-6deg) scale(1); opacity: 1; }
          85% { transform: translateX(-50%) rotate(-6deg) scale(1); opacity: 1; }
          100% { transform: translateX(-50%) rotate(-6deg) scale(0.9); opacity: 0; }
        }
      `}</style>
    </main>
  );
}

function Bubble({ side, win, children }: { side: "you" | "opp"; win?: boolean; children: React.ReactNode }) {
  return (
    <div
      className="absolute z-20 bg-white border-[3px] border-black rounded-xl px-3 py-2 font-black text-xs sm:text-sm max-w-[180px] text-center shadow-[4px_4px_0_#000] animate-[hit-pop_0.4s_ease]"
      style={{
        left: side === "you" ? "12%" : undefined,
        right: side === "opp" ? "12%" : undefined,
        top: win ? "5%" : "10%",
      }}
    >
      {children}
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
