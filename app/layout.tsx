import type { Metadata } from "next";
import { Archivo, Archivo_Black, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Loader from "@/components/Loader";
import Hud from "@/components/Hud";
import Nav from "@/components/Nav";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  variable: "--font-archivo",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-archivo-black",
});

const instrument = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zehrakoc.com"),
  title: "Zehra Koç — Motion Designer & AI Creative Producer",
  description:
    "Senior motion designer and AI creative producer with 14+ years of experience. I don't edit video — I direct attention.",
  openGraph: {
    title: "Zehra Koç — Motion Designer & AI Creative Producer",
    description: "I don't edit video. I direct attention.",
    url: "https://zehrakoc.com",
    siteName: "Zehra Koç",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${archivo.variable} ${archivoBlack.variable} ${instrument.variable} ${plexMono.variable}`}
      >
        <SmoothScroll>
          <Loader />
          <Cursor />
          <Hud />
          <Nav />
          <main>{children}</main>
        </SmoothScroll>
      </body>
    </html>
  );
}
