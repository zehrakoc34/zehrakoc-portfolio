"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Yıllar gerçek kilometre taşları gelene kadar temkinli-genel tutuldu. */
const MILESTONES = [
  { year: "2012", title: "First timeline, first all-nighter", note: "The craft begins." },
  { year: "2016", title: "Broadcast & brand films", note: "Motion becomes a profession." },
  { year: "2020", title: "Leading motion projects", note: "Campaigns, launches, identities." },
  { year: "2023", title: "The AI pipeline", note: "Generative tools join the studio." },
  { year: "2026", title: "Now", note: "Directing attention, faster than ever." },
];

/** 07 · CREDITS — kariyer, film sonu jeneriği gibi akar. */
export default function Credits() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".credit-row").forEach((row) => {
        gsap.fromTo(
          row,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: row, start: "top 82%" },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      data-scene="07 · CREDITS"
      className="bg-[#0c0c0c] px-7 pb-28 pt-4 text-[#fafafa] md:px-10 md:pb-40"
    >
      <div className="mx-auto max-w-2xl border-t border-white/10 pt-24 text-center md:pt-32">
        <span
          className="text-[10px] tracking-[0.3em] text-white/40"
          style={{ fontFamily: "var(--font-plex-mono)" }}
        >
          07 — TIMELINE
        </span>
        <h2 className="mt-4 text-[clamp(2rem,4vw,3.4rem)] font-semibold tracking-tight">
          Credits{" "}
          <em className="font-normal" style={{ fontFamily: "var(--font-instrument)" }}>
            roll.
          </em>
        </h2>

        <div className="mt-20 flex flex-col gap-16">
          {MILESTONES.map((m) => (
            <div key={m.year} className="credit-row">
              <span
                className="text-[11px] tracking-[0.35em] text-[#ff3b30]"
                style={{ fontFamily: "var(--font-plex-mono)" }}
              >
                {m.year}
              </span>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{m.title}</h3>
              <p
                className="mt-1 text-[15px] italic text-white/50"
                style={{ fontFamily: "var(--font-instrument)" }}
              >
                {m.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
