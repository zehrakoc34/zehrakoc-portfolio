"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PROMPT = "a quiet city at dawn, drifting camera, soft film grain";
const TOOLS = ["CHATGPT", "CLAUDE", "FIREFLY", "RUNWAY", "HIGGSFIELD", "VEO", "ELEVENLABS"];

/** 04 · PROMPT TO PICTURE — bir fikrin metinden görüntüye evrimi. */
export default function AiSection() {
  const rootRef = useRef<HTMLElement>(null);
  const promptRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (promptRef.current) promptRef.current.textContent = PROMPT;
      return;
    }
    const ctx = gsap.context(() => {
      // Prompt kendini yazar
      ScrollTrigger.create({
        trigger: promptRef.current,
        start: "top 80%",
        once: true,
        onEnter: () => {
          let i = 0;
          const id = setInterval(() => {
            i++;
            if (promptRef.current) promptRef.current.textContent = PROMPT.slice(0, i);
            if (i >= PROMPT.length) clearInterval(id);
          }, 28);
        },
      });

      // Storyboard kareleri sırayla, sonra "footage"
      gsap.fromTo(
        ".board-frame",
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.18,
          ease: "power3.out",
          scrollTrigger: { trigger: ".board-row", start: "top 75%" },
        }
      );
      gsap.fromTo(
        ".footage",
        { clipPath: "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: 1.2,
          ease: "power3.inOut",
          scrollTrigger: { trigger: ".footage", start: "top 72%" },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      data-scene="04 · PROMPT TO PICTURE"
      className="relative bg-[#0c0c0c] px-7 py-28 text-[#fafafa] md:px-10 md:py-40"
    >
      <span
        className="text-[10px] tracking-[0.3em] text-white/40"
        style={{ fontFamily: "var(--font-plex-mono)" }}
      >
        04 — AI + CREATIVITY
      </span>

      <div className="mt-14 grid gap-16 md:grid-cols-2 md:gap-20">
        {/* Sol: dönüşüm */}
        <div>
          <p
            className="min-h-[3.5rem] max-w-md border-l-2 border-[#ff3b30] pl-4 text-[15px] leading-relaxed text-white/80"
            style={{ fontFamily: "var(--font-plex-mono)" }}
          >
            &gt; <span ref={promptRef} />
            <span className="ml-1 inline-block h-4 w-[7px] animate-pulse bg-[#ff3b30] align-middle" />
          </p>

          <div className="board-row mt-10 grid grid-cols-3 gap-3">
            {["WS — establishing", "TRACK — push in", "CU — light"].map((label) => (
              <div
                key={label}
                className="board-frame flex aspect-video items-end border border-white/20 p-2"
              >
                <span
                  className="text-[8px] tracking-[0.2em] text-white/40"
                  style={{ fontFamily: "var(--font-plex-mono)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="footage grain relative mt-10 aspect-video overflow-hidden">
            <div
              className="absolute inset-[-20%] animate-[drift_14s_ease-in-out_infinite_alternate]"
              style={{
                backgroundImage:
                  "radial-gradient(90% 70% at 30% 80%, rgba(255,171,64,0.75) 0%, rgba(255,171,64,0) 55%), radial-gradient(110% 90% at 75% 10%, rgba(72,109,153,0.9) 0%, rgba(8,12,24,1) 75%)",
              }}
            />
            <span
              className="absolute bottom-3 left-3 text-[9px] tracking-[0.3em] text-white/60"
              style={{ fontFamily: "var(--font-plex-mono)" }}
            >
              RENDER · 4K · GRADED
            </span>
          </div>
        </div>

        {/* Sağ: manifesto */}
        <div className="flex flex-col justify-center">
          <h2 className="text-[clamp(2.2rem,4.5vw,4rem)] leading-[1.08] tracking-tight">
            <span className="font-semibold">AI doesn&rsquo;t imagine.</span>
            <br />
            <em className="font-normal" style={{ fontFamily: "var(--font-instrument)" }}>
              I do.
            </em>{" "}
            <span className="text-white/50">AI just keeps up.</span>
          </h2>
          <p className="mt-8 max-w-md text-[15px] leading-relaxed text-white/60">
            Fourteen years of craft decide what a frame should feel like. Generative tools just
            get me there faster — more drafts, more directions, more courage to throw away
            anything that isn&rsquo;t right.
          </p>
          <p
            className="mt-10 text-[10px] leading-loose tracking-[0.25em] text-white/40"
            style={{ fontFamily: "var(--font-plex-mono)" }}
          >
            {TOOLS.join(" · ")}
          </p>
        </div>
      </div>

      <style>{`@keyframes drift { from { transform: translate(-2%, -2%) scale(1); } to { transform: translate(2%, 2%) scale(1.08); } }`}</style>
    </section>
  );
}
