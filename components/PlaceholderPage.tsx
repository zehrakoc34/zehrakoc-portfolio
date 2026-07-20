import Link from "next/link";

/** Tasarımı henüz yapılmamış sayfalar için sade, hatasız bekleme ekranı. */
export default function PlaceholderPage({ label, title }: { label: string; title: string }) {
  return (
    <section className="flex min-h-svh flex-col items-center justify-center bg-[#fafafa] px-7 text-center">
      <span
        className="text-[10px] tracking-[0.3em] text-[#8a8a8a]"
        style={{ fontFamily: "var(--font-plex-mono)" }}
      >
        {label}
      </span>
      <h1 className="mt-6 text-[clamp(2.5rem,8vw,5rem)] font-semibold leading-none tracking-tight text-[#111]">
        {title}
      </h1>
      <p className="mt-5 text-[15px] text-[#8a8a8a]">This page is being designed.</p>
      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#111] px-6 py-3 text-[13px] font-medium transition-colors duration-300 hover:bg-[#0c0c0c] hover:text-white"
      >
        <span aria-hidden>←</span> Back home
      </Link>
    </section>
  );
}
