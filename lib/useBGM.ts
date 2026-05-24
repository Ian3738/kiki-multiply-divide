"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Gapless background music loop 用 Web Audio API。
 *
 * 為何不用 <audio loop>？因為 MP3 編碼器在開頭/結尾加 padding silence，
 * <audio loop> 會聽到「停頓→重新開始」的斷裂感。
 * Web Audio API decodeAudioData + AudioBufferSourceNode.loop = true 是
 * 瀏覽器原生支援的 gapless loop，首尾完美銜接。
 *
 * @param src 音檔 URL
 * @param shouldPlay 應該播放（通常綁 phase === 'playing'）
 * @param muted 靜音（gain 0）
 * @param volume 預設音量 (0–1)
 */
export function useBGM(
  src: string,
  shouldPlay: boolean,
  muted: boolean,
  volume = 0.4,
) {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);

  // 一次性：建立 AudioContext + 載入 buffer
  useEffect(() => {
    if (typeof window === "undefined") return;
    const AC: typeof AudioContext | undefined =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    ctxRef.current = ctx;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    let cancelled = false;
    fetch(src)
      .then((r) => r.arrayBuffer())
      .then((b) => ctx.decodeAudioData(b))
      .then((buf) => {
        if (!cancelled) setBuffer(buf);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      try {
        sourceRef.current?.stop();
      } catch {}
      sourceRef.current = null;
      ctx.close().catch(() => {});
    };
    // 只在 mount 跑一次；src 變更不重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 控制播放與音量
  useEffect(() => {
    const ctx = ctxRef.current;
    const gain = gainRef.current;
    if (!ctx || !gain || !buffer) return;

    // mute 透過 gain 切換（不會打斷 loop）
    gain.gain.value = muted ? 0 : volume;

    if (shouldPlay) {
      if (!sourceRef.current) {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.connect(gain);
        // 必須 resume — 即使初始就在 user gesture 內，
        // 某些瀏覽器 mounted 後 ctx 仍是 suspended
        ctx.resume().catch(() => {});
        try {
          src.start();
        } catch {}
        sourceRef.current = src;
      }
    } else {
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch {}
        sourceRef.current = null;
      }
    }
  }, [shouldPlay, muted, buffer, volume]);
}
