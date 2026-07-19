"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Özel imleç: küçük nokta; [data-cursor="play"] üstünde "● PLAY" rozetine,
 * [data-cursor="link"] üstünde halkaya dönüşür. Dokunmatikte hiç render edilmez.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"dot" | "play" | "link">("dot");
  const [fine, setFine] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setFine(true);

    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const target = (e.target as HTMLElement).closest("[data-cursor]");
      setMode((target?.getAttribute("data-cursor") as "play" | "link") ?? "dot");
    };

    const loop = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };

    addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!fine) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90] mix-blend-difference"
    >
      {mode === "play" ? (
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-[#ff3b30]" />
          <span className="font-mono-tc text-[11px] tracking-[0.2em] text-black" style={{ fontFamily: "var(--font-plex-mono)" }}>
            PLAY
          </span>
        </div>
      ) : mode === "link" ? (
        <div className="h-10 w-10 rounded-full border border-white" />
      ) : (
        <div className="h-2 w-2 rounded-full bg-white" />
      )}
    </div>
  );
}
