"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const EMAIL = "ai.zehrakoc@gmail.com";

/** 08 · FIN — form yok; tek, kendinden emin davet. Manyetik e-posta düğmesi. */
export default function Contact() {
  const rootRef = useRef<HTMLElement>(null);
  const magnetRef = useRef<HTMLAnchorElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const spans = rootRef.current?.querySelectorAll(".line-mask > span");
      if (spans) {
        gsap.to(spans, {
          y: 0,
          duration: 1,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 62%" },
        });
      }
    }, rootRef);

    // Manyetik düğme
    const el = magnetRef.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return () => ctx.revert();

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: dx * 0.25, y: dy * 0.25, duration: 0.4, ease: "power3.out" });
    };
    const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" });
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      ctx.revert();
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const copy = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard?.writeText(EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
    location.href = `mailto:${EMAIL}`;
  };

  return (
    <section
      ref={rootRef}
      data-scene="08 · FIN"
      className="flex min-h-svh flex-col justify-between bg-[#fafafa] px-7 pb-8 pt-28 md:px-10 md:pt-40"
    >
      <div>
        <span
          className="text-[10px] tracking-[0.3em] text-[#8a8a8a]"
          style={{ fontFamily: "var(--font-plex-mono)" }}
        >
          08 — CONTACT
        </span>
        <h2 className="mt-8 text-[clamp(2.6rem,7vw,6.5rem)] font-semibold leading-[1.02] tracking-tight">
          <span className="line-mask">
            <span>Let&rsquo;s make something</span>
          </span>
          <span className="line-mask">
            <span>
              worth{" "}
              <em className="font-normal" style={{ fontFamily: "var(--font-instrument)" }}>
                watching.
              </em>
            </span>
          </span>
        </h2>

        <a
          ref={magnetRef}
          href={`mailto:${EMAIL}`}
          onClick={copy}
          data-cursor="link"
          className="mt-16 inline-flex items-center gap-4 rounded-full border border-[#111] px-8 py-4 text-[15px] font-medium transition-colors duration-300 hover:bg-[#0c0c0c] hover:text-white"
        >
          <span className="h-2 w-2 rounded-full bg-[#ff3b30]" />
          {copied ? "Copied to clipboard" : EMAIL}
        </a>
      </div>

      <footer className="flex items-end justify-between pt-24 text-[11px] text-[#8a8a8a]">
        <span>© 2026 Zehra Koç</span>
        <span style={{ fontFamily: "var(--font-plex-mono)" }} className="tracking-[0.25em]">
          MADE WITH CRAFT + AI
        </span>
        <span className="flex items-center gap-2">
          <span className="h-[6px] w-[6px] rounded-full bg-[#ff3b30]" />
          <span style={{ fontFamily: "var(--font-plex-mono)" }} className="tracking-[0.25em]">
            FIN
          </span>
        </span>
      </footer>
    </section>
  );
}
