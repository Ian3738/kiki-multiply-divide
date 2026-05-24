"use client";

import { useEffect, useRef } from "react";

/**
 * BGM hook：用 <audio loop> 確保最大相容性 + 第一次播放失敗時掛 user gesture listener。
 *
 * Gap 問題備註：MP3 的首尾 padding 會讓 loop 有微小斷裂。本版優先確保「有聲音」，
 * gapless 由 audio 檔案本身處理（用 ffmpeg 切首尾 silence + crossfade，或改用 ogg）。
 */
export function useBGM(
  src: string,
  shouldPlay: boolean,
  muted: boolean,
  volume = 0.4,
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 建立 audio element 一次
  useEffect(() => {
    if (typeof window === "undefined") return;
    const a = new Audio(src);
    a.loop = true;
    a.preload = "auto";
    a.volume = volume;
    audioRef.current = a;
    return () => {
      a.pause();
      a.src = "";
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // 控制播放
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
    a.muted = muted;

    if (!shouldPlay || muted) {
      a.pause();
      return;
    }

    // 嘗試播放；若被 autoplay policy 擋，掛 click/touchstart listener 一次性兜底
    const tryPlay = () => {
      void a.play().catch(() => {});
    };
    tryPlay();
    if (a.paused) {
      const oneShot = () => {
        tryPlay();
        if (!a.paused) {
          document.removeEventListener("click", oneShot, true);
          document.removeEventListener("touchstart", oneShot, true);
          document.removeEventListener("keydown", oneShot, true);
        }
      };
      document.addEventListener("click", oneShot, true);
      document.addEventListener("touchstart", oneShot, true);
      document.addEventListener("keydown", oneShot, true);
      return () => {
        document.removeEventListener("click", oneShot, true);
        document.removeEventListener("touchstart", oneShot, true);
        document.removeEventListener("keydown", oneShot, true);
      };
    }
  }, [shouldPlay, muted, volume]);
}
