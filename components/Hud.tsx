"use client";

import { useEffect, useRef } from "react";

/**
 * Köşe HUD: sağ üstte scroll ile ilerleyen timecode, sol altta aktif sahne etiketi.
 * mix-blend-difference sayesinde hem beyaz hem siyah sahnede okunur.
 */
export default function Hud() {
  const tcRef = useRef<HTMLSpanElement>(null);
  const sceneRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const sections = () => Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));

    const loop = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      // "Film süresi": 2 dk 24 sn @24fps
      const totalFrames = Math.floor(p * 144 * 24);
      const m = Math.floor(totalFrames / (60 * 24));
      const s = Math.floor(totalFrames / 24) % 60;
      const f = totalFrames % 24;
      if (tcRef.current) {
        tcRef.current.textContent = `TC 00:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
      }
      const mid = innerHeight * 0.5;
      let label = "";
      for (const el of sections()) {
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) {
          label = el.dataset.scene ?? "";
          break;
        }
      }
      if (sceneRef.current && sceneRef.current.textContent !== label) {
        sceneRef.current.textContent = label;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <span
        ref={tcRef}
        aria-hidden
        className="fixed right-7 top-6 z-[80] text-[10px] tracking-[0.25em] text-white mix-blend-difference md:right-10"
        style={{ fontFamily: "var(--font-plex-mono)" }}
      >
        TC 00:00:00:00
      </span>
      <span
        ref={sceneRef}
        aria-hidden
        className="fixed bottom-6 left-7 z-[80] text-[10px] tracking-[0.25em] text-white mix-blend-difference md:left-10"
        style={{ fontFamily: "var(--font-plex-mono)" }}
      />
    </>
  );
}
