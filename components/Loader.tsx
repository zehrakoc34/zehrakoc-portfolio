"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/** Açılış: siyahta timecode 00:00:00 → 00:00:14 sayar (14 yıla selam), yukarı wipe ile açılır. */
export default function Loader() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const tcRef = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDone(true);
      return;
    }
    document.documentElement.style.overflow = "hidden";

    const counter = { f: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        document.documentElement.style.overflow = "";
        setDone(true);
      },
    });

    tl.to(counter, {
      f: 14 * 24,
      duration: 1.05,
      ease: "power2.inOut",
      onUpdate: () => {
        const total = Math.floor(counter.f);
        const s = Math.floor(total / 24);
        const fr = total % 24;
        if (tcRef.current) {
          tcRef.current.textContent = `00:00:${String(s).padStart(2, "0")}:${String(fr).padStart(2, "0")}`;
        }
      },
    })
      .to(wrapRef.current, { autoAlpha: 1, duration: 0.01 }, 0)
      .to(wrapRef.current, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.7,
        ease: "power3.inOut",
        delay: 0.15,
      });

    return () => {
      tl.kill();
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 z-[100] flex items-end justify-between bg-[#0c0c0c] p-7 md:p-10"
      style={{ clipPath: "inset(0 0 0% 0)" }}
    >
      <span
        className="text-[11px] tracking-[0.3em] text-white/60"
        style={{ fontFamily: "var(--font-plex-mono)" }}
      >
        ZEHRA KOÇ
      </span>
      <span className="flex items-center gap-3">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff3b30]" />
        <span
          ref={tcRef}
          className="text-[11px] tracking-[0.25em] text-white"
          style={{ fontFamily: "var(--font-plex-mono)" }}
        >
          00:00:00:00
        </span>
      </span>
    </div>
  );
}
