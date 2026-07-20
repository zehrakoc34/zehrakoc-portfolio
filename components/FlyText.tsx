"use client";

import { useEffect, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface FlyTextOptions {
  windAngle: number; // derece: 0 = sağ, 90 = yukarı, 180 = sol
  windStrength: number; // px: rüzgar yönünde kat edilen mesafe
  scatter: number; // px: dikey rastgele sapma
  maxRotation: number; // derece: herhangi bir eksende maksimum rotasyon
  stagger: number; // 0-1: timeline üzerinde harf başlangıç zamanlarının yayılımı
  depth: number; // px: maksimum Z hareketi
  reverse: boolean; // true: scroll ile metin toparlanır, false: dağılır
  order: "random" | "ltr" | "rtl" | "outward";
  randomness: number; // 0 = düzenli sıra, 1 = tamamen rastgele stagger
  gustiness: number; // px: uçuş sırasında rüzgara dik yönde sürüklenme
  gustFrequency: number; // uçuş boyunca sinüs döngü sayısı
  gustPhaseSpread: number; // 0-1: sinüs fazının harfler arasında yayılımı
  startY: number | null; // null: reverse'e göre varsayılan (.85 / .65)
  animationDuration: number; // scroll süresinin ne kadarını animasyonun kaplayacağı (0-1)
  easing: string | null;
}

const FLY_TEXT_DEFAULTS: FlyTextOptions = {
  windAngle: 25,
  windStrength: 400,
  scatter: 80,
  maxRotation: 360,
  stagger: 0.5,
  depth: 120,
  reverse: false,
  order: "random",
  randomness: 0,
  gustiness: 0,
  gustFrequency: 1,
  gustPhaseSpread: 1,
  startY: null,
  animationDuration: 1,
  easing: null,
};

// ── Tohumlu rastgelelik: aynı seed her yeniden ölçümde (resize) aynı
// dağılım desenini üretir, sayfa her yenilendiğinde aynı hissi verir. ──
function sfc32(a: number, b: number, c: number, d: number) {
  return function () {
    a |= 0; b |= 0; c |= 0; d |= 0;
    const t = ((a + b) | 0) + d | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}
function seededRandom(seed: number) {
  let s = seed >>> 0;
  const splitmix32 = () => {
    s = (s + 0x9e3779b9) | 0;
    let t = s ^ (s >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return (t ^ (t >>> 15)) >>> 0;
  };
  const rnd = sfc32(splitmix32(), splitmix32(), splitmix32(), splitmix32());
  for (let i = 0; i < 12; i++) rnd();
  return rnd;
}

const SEED = 42;
let r = seededRandom(SEED);

const rand = (min: number, max: number) => min + r() * (max - min);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type CharSpan = HTMLSpanElement & { _x: number; _normX: number };

// DOM yapısı: `host`, React'in boş (display:contents) yarattığı ve hiç
// çocuğunu takip etmediği bir düğüm — imperatif kod yalnız onun İÇİNİ
// doldurur/boşaltır, `el`in kendi çocuklarına asla dokunmaz. Böylece React
// unmount sırasında kendi yarattığı bir düğümü "kayıp" bulup
// removeChild hatası vermez.
function buildStructure(host: HTMLElement, text: string) {
  host.innerHTML = "";

  const placeholder = document.createElement("span");
  placeholder.setAttribute("aria-hidden", "true");
  placeholder.style.cssText = "visibility:hidden; pointer-events:none; user-select:none;";
  placeholder.textContent = text;
  host.appendChild(placeholder);

  const overlay = document.createElement("span");
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.cssText =
    "position:absolute; top:0; left:0; width:100%; height:100%; overflow:visible; pointer-events:none;";
  host.appendChild(overlay);

  return { placeholder, overlay };
}

// Range API ile her harfin gerçekten çizildiği piksel kutusunu ölçüp
// aynı konumda mutlak konumlu bir span oluşturur. Konum `el`e göre alınır
// (host, display:contents olduğu için kendi kutusu yok — el'in kutusu asıl).
function measureAndCreateChars(
  el: HTMLElement,
  raw: string,
  placeholder: HTMLElement,
  overlay: HTMLElement
): CharSpan[] {
  const containerRect = el.getBoundingClientRect();
  const textNode = placeholder.firstChild as Text;
  const chars: CharSpan[] = [];

  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === " ") continue;

    const range = document.createRange();
    range.setStart(textNode, i);
    range.setEnd(textNode, i + 1);
    const rect = range.getBoundingClientRect();

    const span = document.createElement("span") as CharSpan;
    span.textContent = raw[i];
    span.classList.add("fly-char");
    span.style.cssText = [
      "position:absolute",
      `left:${rect.left - containerRect.left}px`,
      `top:${rect.top - containerRect.top}px`,
      `width:${rect.width}px`,
      `height:${rect.height}px`,
      "white-space:nowrap",
    ].join(";");
    span._x = rect.left - containerRect.left;
    overlay.appendChild(span);
    chars.push(span);
  }

  const xs = chars.map((c) => c._x);
  const xMin = Math.min(...xs);
  const xRange = Math.max(...xs) - xMin || 1;
  chars.forEach((c) => {
    c._normX = (c._x - xMin) / xRange;
  });

  return chars;
}

function charStartTime(
  char: CharSpan,
  total: number,
  order: FlyTextOptions["order"],
  stagger: number,
  randomness = 0
): number {
  if (total <= 1) return 0;
  const x = char._normX;
  let ordered: number;
  switch (order) {
    case "ltr":
      ordered = x * stagger;
      break;
    case "rtl":
      ordered = (1 - x) * stagger;
      break;
    case "outward":
      ordered = (1 - Math.abs(x - 0.5) * 2) * stagger;
      break;
    default:
      return rand(0, stagger);
  }
  return ordered * (1 - randomness) + rand(0, stagger) * randomness;
}

function buildTimeline(el: HTMLElement, chars: CharSpan[], p: FlyTextOptions): gsap.core.Timeline {
  const {
    reverse, windAngle, windStrength, scatter, maxRotation, depth,
    order, stagger, randomness, gustiness, gustFrequency, gustPhaseSpread, easing,
  } = p;

  const tl = gsap.timeline({ paused: true });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const from = reverse ? { opacity: 0 } : { opacity: 1 };
    const to = reverse ? { opacity: 1 } : { opacity: 0 };
    tl.fromTo(el, from, { ...to, duration: 1 });
    return tl;
  }

  const rad = (windAngle * Math.PI) / 180;
  const windX = Math.cos(rad);
  const windY = -Math.sin(rad);
  const perpX = Math.sin(rad);
  const perpY = Math.cos(rad);

  const sharedAmp = gustiness > 0 ? rand(0.1, 1.0) * gustiness * (r() > 0.5 ? 1 : -1) : 0;

  chars.forEach((char, i) => {
    const startTime = charStartTime(char, chars.length, order, stagger, randomness);
    const duration = rand(1 - randomness * 0.5, 1 + randomness * 0.5);
    const scatterAngle = rand(0, Math.PI * 2);
    const scatterDist = rand(0, scatter);
    const syncPhase = Math.PI * gustFrequency * startTime;
    const indexPhase = (i / Math.max(1, chars.length - 1)) * Math.PI * 2;
    const phase = lerp(syncPhase, indexPhase, gustPhaseSpread);

    const fx = windX * windStrength + Math.cos(scatterAngle) * scatterDist;
    const fy = windY * windStrength + Math.sin(scatterAngle) * scatterDist;
    const fz = rand(-depth, depth);
    const rx = rand(-maxRotation, maxRotation);
    const ry = rand(-maxRotation * 0.7, maxRotation * 0.7);
    const rz = rand(-maxRotation * 0.3, maxRotation * 0.3);

    const scattered = { x: fx, y: fy, z: fz, rotationX: rx, rotationY: ry, rotationZ: rz, opacity: 0 };
    const natural = { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, opacity: 1 };

    if (gustiness > 0) {
      const individualAmp = rand(0.1, 1.0) * gustiness * (r() > 0.5 ? 1 : -1);
      const amp = lerp(sharedAmp, individualAmp, gustPhaseSpread);

      const s0 = Math.sin(phase);
      const s1 = Math.sin(Math.PI * gustFrequency + phase);
      const gustSine = (t: number) =>
        amp * (Math.sin(Math.PI * gustFrequency * t + phase) - s0 - t * (s1 - s0));

      const sineAt = (t: number) => {
        const s = reverse ? 1 - t : t;
        return {
          x: s * fx + perpX * gustSine(t),
          y: s * fy + perpY * gustSine(t),
          z: s * fz,
          rotationX: rx * s,
          rotationY: ry * s,
          rotationZ: rz * s,
          opacity: clamp01((1 - s) / 0.6),
        };
      };

      gsap.set(char, sineAt(0));
      const proxy = { t: 0 };

      tl.to(
        proxy,
        {
          t: 1,
          duration,
          ease: easing ? easing : "power3.in",
          immediateRender: true,
          onUpdate() {
            gsap.set(char, sineAt(proxy.t));
          },
        },
        startTime
      );
    } else {
      const [from, to] = reverse ? [scattered, natural] : [natural, scattered];
      tl.fromTo(
        char,
        from,
        { ...to, duration, ease: easing ?? (reverse ? "power3.out" : "power3.in") },
        startTime
      );
    }
  });

  const animDuration = p.animationDuration;
  if (animDuration > 0 && animDuration < 1) {
    tl.call(() => {}, [], tl.duration() / animDuration);
  }

  return tl;
}

/**
 * Bir elemanın metnini karakterlere ayırıp scroll-scrub'lı "rüzgarda
 * uçuşma/toparlanma" animasyonu kurar. `host`, React'in boş yarattığı ve
 * içeriğini hiç izlemediği ayrı bir düğüm — buradaki tüm DOM mutasyonları
 * React'in fiber ağacından tamamen bağımsızdır. Temizlik fonksiyonu döner.
 */
function initFlyText(
  el: HTMLElement,
  host: HTMLElement,
  raw: string,
  overrides: Partial<FlyTextOptions>
): () => void {
  const p: FlyTextOptions = { ...FLY_TEXT_DEFAULTS, ...overrides };
  const { placeholder, overlay } = buildStructure(host, raw);

  let st: ScrollTrigger | null = null;
  let tl: gsap.core.Timeline | null = null;
  let destroyed = false;

  function setup() {
    if (destroyed) return;
    st?.kill();
    tl?.kill();

    overlay.innerHTML = "";
    const chars = measureAndCreateChars(el, raw, placeholder, overlay);
    if (!chars.length) return;

    gsap.set(chars, { transformPerspective: 500 });
    tl = buildTimeline(el, chars, p);

    // Eleman zaten katlama üstündeyse (sayfa en üstte iken görünür alanda),
    // scroll-scrub için gerekli "yukarı kaydırma payı" yok — bu durumda
    // scrolla bağlı kalmadan normal bir giriş animasyonu gibi oynat.
    const aboveTheFold = el.getBoundingClientRect().top < window.innerHeight * 0.9;

    if (aboveTheFold) {
      tl.play(0);
      return;
    }

    const startPct = Math.round((p.startY ?? (p.reverse ? 0.85 : 0.65)) * 100);

    st = ScrollTrigger.create({
      trigger: el,
      start: `top ${startPct}%`,
      end: p.reverse ? "top 20%" : "bottom top",
      scrub: 1,
      animation: tl,
    });
  }

  setup();

  let resizeTimer: ReturnType<typeof setTimeout>;
  let lastW = 0, lastH = 0;
  const ro = new ResizeObserver(([entry]) => {
    r = seededRandom(SEED);
    const { inlineSize: w, blockSize: h } = entry.contentBoxSize[0];
    if (w === lastW && h === lastH) return;
    lastW = w; lastH = h;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setup, 200);
  });
  ro.observe(el);

  return () => {
    destroyed = true;
    clearTimeout(resizeTimer);
    ro.disconnect();
    st?.kill();
    tl?.kill();
  };
}

interface FlyTextProps extends Partial<FlyTextOptions> {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "blockquote";
  className?: string;
  style?: CSSProperties;
}

/** Scroll-scrub'lı rüzgarda uçuşan/toparlanan karakter metni. */
export default function FlyText({ text, as = "span", className, style, ...options }: FlyTextProps) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [host, setHost] = useState<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!el || !host) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      cleanup = initFlyText(el, host, text, options);
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, host]);

  const inner = (
    <>
      <span className="visually-hidden">{text}</span>
      <span ref={setHost} aria-hidden="true" style={{ display: "contents" }} />
    </>
  );

  if (as === "h1") return <h1 ref={setEl} className={className} style={style}>{inner}</h1>;
  if (as === "h2") return <h2 ref={setEl} className={className} style={style}>{inner}</h2>;
  if (as === "h3") return <h3 ref={setEl} className={className} style={style}>{inner}</h3>;
  if (as === "p") return <p ref={setEl} className={className} style={style}>{inner}</p>;
  if (as === "blockquote")
    return (
      <blockquote ref={setEl} className={className} style={style}>
        {inner}
      </blockquote>
    );
  return (
    <span ref={setEl} className={className} style={style}>
      {inner}
    </span>
  );
}
