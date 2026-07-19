"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CRAFT = ["Creative Direction", "Motion Design", "Video Production", "Visual Storytelling"];
const TOOLS = ["Adobe Suite", "Figma", "Cinema 4D", "AI Stack"];

/** 06 · TOOLKIT — logo ızgarası yok; hover'da ağırlığı canlanan tipografi. */
export default function Toolkit() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".tool-item",
        { y: 34, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.7,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 70%" },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      data-scene="06 · TOOLKIT"
      className="bg-[#0c0c0c] px-7 py-28 text-[#fafafa] md:px-10 md:py-40"
    >
      <span
        className="text-[10px] tracking-[0.3em] text-white/40"
        style={{ fontFamily: "var(--font-plex-mono)" }}
      >
        06 — SKILLS
      </span>

      <div className="mt-14 grid gap-16 md:grid-cols-2">
        <div>
          <h3
            className="mb-8 text-lg italic text-white/50"
            style={{ fontFamily: "var(--font-instrument)" }}
          >
            Craft
          </h3>
          <ul>
            {CRAFT.map((c) => (
              <li key={c} className="tool-item border-b border-white/10 py-4">
                <span className="living-word block cursor-default text-[clamp(1.6rem,3vw,2.6rem)] tracking-tight">
                  {c}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3
            className="mb-8 text-lg italic text-white/50"
            style={{ fontFamily: "var(--font-instrument)" }}
          >
            Tools
          </h3>
          <ul>
            {TOOLS.map((t) => (
              <li key={t} className="tool-item border-b border-white/10 py-4">
                <span className="living-word block cursor-default text-[clamp(1.6rem,3vw,2.6rem)] tracking-tight">
                  {t}
                </span>
                {t === "AI Stack" && (
                  <span
                    className="mt-2 block text-[10px] leading-relaxed tracking-[0.2em] text-white/40"
                    style={{ fontFamily: "var(--font-plex-mono)" }}
                  >
                    CHATGPT · CLAUDE · FIREFLY · RUNWAY · HIGGSFIELD · VEO · ELEVENLABS
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
