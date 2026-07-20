"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/work", label: "WORK" },
  { href: "/about", label: "ABOUT" },
  { href: "/contact", label: "CONTACT" },
];

/**
 * Masaüstünde üst-orta sabit metin nav (Hero'nun sol üstteki isim bloğuyla,
 * Hud'un sağ üstteki timecode'uyla çakışmaz). Mobilde dar ekranda üçü aynı
 * satıra sığmadığı için sağ altta ayrı bir menü düğmesi + tam ekran overlay.
 */
export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed left-1/2 top-6 z-[80] hidden -translate-x-1/2 items-center gap-8 text-[10px] tracking-[0.25em] text-white mix-blend-difference md:flex"
        style={{ fontFamily: "var(--font-plex-mono)" }}
      >
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-opacity duration-300 hover:opacity-60 ${active ? "opacity-100" : "opacity-50"}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobil: köşede düğme, tam ekran overlay */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="fixed bottom-6 right-7 z-[95] flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white mix-blend-difference md:hidden"
      >
        <span className="relative block h-3 w-4" aria-hidden>
          <span
            className={`absolute left-0 top-0 h-px w-full bg-white transition-transform duration-300 ${open ? "translate-y-[6px] rotate-45" : ""}`}
          />
          <span
            className={`absolute bottom-0 left-0 h-px w-full bg-white transition-transform duration-300 ${open ? "-translate-y-[6px] -rotate-45" : ""}`}
          />
        </span>
      </button>

      <div
        className={`fixed inset-0 z-[90] flex flex-col items-center justify-center gap-8 bg-[#0c0c0c] transition-opacity duration-300 md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className="text-3xl font-semibold tracking-tight text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </>
  );
}
