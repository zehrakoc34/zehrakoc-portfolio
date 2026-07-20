"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const TEASER_PROJECTS = ["Brand Film", "AI Production", "Title Sequence"];

/** Home sayfasında Hero'nun altında kısa bir "Selected work" özeti — tam listeye yönlendirir. */
export default function WorkTeaser() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".teaser-line",
        { y: 20, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 75%" },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="border-t border-[#111]/10 bg-[#fafafa] px-7 py-20 md:px-10 md:py-28">
      <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div>
          <span
            className="teaser-line block text-[10px] tracking-[0.3em] text-[#8a8a8a]"
            style={{ fontFamily: "var(--font-plex-mono)" }}
          >
            SELECTED WORK
          </span>
          <ul className="mt-5 flex flex-col gap-1">
            {TEASER_PROJECTS.map((title) => (
              <li key={title} className="teaser-line text-[clamp(1.6rem,3.2vw,2.6rem)] font-semibold tracking-tight text-[#111]">
                {title}
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/work"
          data-cursor="link"
          className="teaser-line inline-flex w-fit items-center gap-3 rounded-full border border-[#111] px-6 py-3 text-[13px] font-medium transition-colors duration-300 hover:bg-[#0c0c0c] hover:text-white"
        >
          View all work
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
