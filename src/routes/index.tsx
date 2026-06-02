import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toPng } from "html-to-image";
import { Music, Volume2, VolumeX } from "lucide-react";
import hands from "@/assets/hands.webp";

// Your deployed origin, e.g. "https://adhil-safa.example.com" (NO trailing slash).
// WhatsApp/Facebook require an ABSOLUTE og:image URL, so set this before sharing the link.
// Left blank it falls back to a root-relative path, which previews correctly in most
// modern crawlers but is less reliable on WhatsApp.
const SITE_URL = "";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Adhil & Safa — Wedding Invitation · 11.07.2026" },
      {
        name: "description",
        content:
          "With joyful hearts, we invite you to the wedding ceremony of Adhil & Safa on Saturday, 11 July 2026 at Hibas Auditorium, Koorachundu.",
      },
      { property: "og:title", content: "Adhil & Safa — Wedding Invitation" },
      {
        property: "og:description",
        content: "Saturday, 11 July 2026 · Wedding 12:30 PM · Hibas Auditorium, Koorachundu",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "The wedding of Adhil & Safa — 11 July 2026" },
      ...(SITE_URL ? [{ property: "og:url", content: SITE_URL }] : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Jost:wght@300;400;500&family=Pinyon+Script&display=swap",
      },
    ],
  }),
  component: Invitation,
});

const TARGET = new Date("2026-07-11T12:30:00+05:30").getTime();

function useCountdown() {
  // Start as null so server and first client render agree (avoids hydration mismatch);
  // the live value is filled in after mount.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  // Until mounted, diff is 0 on BOTH server and client (Date.now() would differ between
  // the two and re-introduce the mismatch); the real value appears on the next tick.
  const diff = now === null ? 0 : Math.max(0, TARGET - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 text-[color:var(--gold)]">
      <span className="h-px w-12 bg-[color:var(--gold)]/60" />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z"
          fill="currentColor"
          opacity="0.85"
        />
      </svg>
      <span className="h-px w-12 bg-[color:var(--gold)]/60" />
    </div>
  );
}

// Reveals children with a fade-up the first time they scroll into view.
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

// --- Event details (single source of truth for calendar links) ---
const EVENT = {
  title: "Wedding of Adhil & Safa",
  details: "With joyful hearts, we invite you to the wedding ceremony of Adhil & Safa.",
  location: "Hibas Auditorium, Koorachundu, Kozhikode, Kerala",
  // 11 July 2026, 12:30 PM IST (+05:30) → 07:00 UTC; ends 3 hours later.
  startUtc: "20260711T070000Z",
  endUtc: "20260711T100000Z",
};

function googleCalendarUrl() {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: EVENT.title,
    dates: `${EVENT.startUtc}/${EVENT.endUtc}`,
    details: EVENT.details,
    location: EVENT.location,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

// Downloads an .ics file (Apple Calendar / Outlook).
function downloadIcs() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Adhil & Safa//Wedding//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:adhil-safa-wedding-2026-07-11@invitation",
    `DTSTAMP:${EVENT.startUtc}`,
    `DTSTART:${EVENT.startUtc}`,
    `DTEND:${EVENT.endUtc}`,
    `SUMMARY:${EVENT.title}`,
    `DESCRIPTION:${EVENT.details}`,
    `LOCATION:${EVENT.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "adhil-safa-wedding.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Outline button matching the existing "Open in Google Maps" style.
function OutlineButton({
  children,
  onClick,
  href,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const cls =
    "group relative inline-block overflow-hidden border border-[color:var(--burgundy)] px-10 py-4 text-[11px] uppercase tracking-[0.3em] text-[color:var(--burgundy)] transition-colors duration-500 hover:text-primary-foreground";
  const inner = (
    <>
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 bg-[color:var(--burgundy)] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
    </>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: "Adhil & Safa — Wedding Invitation",
      text: "You're invited to the wedding of Adhil & Safa · 11 July 2026, Hibas Auditorium, Koorachundu.",
      url,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user dismissed the share sheet — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — last resort: open WhatsApp with the link
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${shareData.text} ${url}`)}`,
        "_blank",
        "noreferrer",
      );
    }
  }

  return (
    <OutlineButton onClick={handleShare}>
      {copied ? "Link copied ✓" : "Share invitation"}
    </OutlineButton>
  );
}

// Single "Add to Calendar" button that routes by device:
// Apple (iPhone / iPad / Mac) → .ics for Apple Calendar; everything else → Google Calendar.
function AddToCalendarButton() {
  function handleClick() {
    const ua = navigator.userAgent || "";
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      // iPadOS 13+ reports as a Mac, so disambiguate with touch points.
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isApple = isIOS || /Macintosh|Mac OS X/.test(ua);

    if (isApple) {
      downloadIcs();
    } else {
      window.open(googleCalendarUrl(), "_blank", "noreferrer");
    }
  }

  return <OutlineButton onClick={handleClick}>Add to Calendar</OutlineButton>;
}

/* ------------------------------------------------------------------ *
 * Downloadable invitation card
 *
 * A fixed-size (portrait) card rendered off-screen, captured to PNG with
 * html-to-image. It uses explicit hex colours instead of the site's oklch
 * CSS variables, because html-to-image can't reliably serialise oklch().
 * ------------------------------------------------------------------ */
const INK = "#2a211f";
const BURGUNDY = "#6e2433";
const GOLD = "#9c7b3f";
const GOLD_SOFT = "rgba(176, 137, 78, 0.5)";
const MUTED = "#786f64";
const SAGE = "#c7d3c2";
const IVORY = "#fbfaf6";

const SERIF = '"Playfair Display", "Cormorant Garamond", Georgia, serif';
const SCRIPT = '"Pinyon Script", cursive';
const SANS = '"Jost", system-ui, sans-serif';

function PrintableCard({ cardRef }: { cardRef: React.Ref<HTMLDivElement> }) {
  const label: React.CSSProperties = {
    fontFamily: SANS,
    fontSize: 14,
    letterSpacing: "0.35em",
    textTransform: "uppercase",
    color: MUTED,
  };
  const lineage: React.CSSProperties = {
    fontFamily: SERIF,
    fontStyle: "italic",
    fontSize: 17,
    color: MUTED,
    margin: "10px auto 0",
    maxWidth: 540,
    lineHeight: 1.5,
  };
  const corner = (pos: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    width: 26,
    height: 26,
    ...pos,
  });

  return (
    <div
      ref={cardRef}
      style={{
        width: 1080,
        padding: 64,
        boxSizing: "border-box",
        background: `radial-gradient(900px 460px at 8% -5%, rgba(170,196,170,0.40), transparent 60%), radial-gradient(760px 420px at 105% 108%, rgba(170,196,170,0.36), transparent 60%), ${IVORY}`,
        color: INK,
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          position: "relative",
          background: "#fffefb",
          border: `1px solid ${SAGE}`,
          padding: "92px 72px 80px",
          textAlign: "center",
        }}
      >
        {/* decorative gold frame + corners */}
        <div
          style={{
            position: "absolute",
            inset: 14,
            border: `1px solid ${GOLD_SOFT}`,
            pointerEvents: "none",
          }}
        />
        <span
          style={corner({
            top: 6,
            left: 6,
            borderTop: `1px solid ${GOLD}`,
            borderLeft: `1px solid ${GOLD}`,
          })}
        />
        <span
          style={corner({
            top: 6,
            right: 6,
            borderTop: `1px solid ${GOLD}`,
            borderRight: `1px solid ${GOLD}`,
          })}
        />
        <span
          style={corner({
            bottom: 6,
            left: 6,
            borderBottom: `1px solid ${GOLD}`,
            borderLeft: `1px solid ${GOLD}`,
          })}
        />
        <span
          style={corner({
            bottom: 6,
            right: 6,
            borderBottom: `1px solid ${GOLD}`,
            borderRight: `1px solid ${GOLD}`,
          })}
        />

        <p dir="rtl" lang="ar" style={{ fontSize: 34, color: BURGUNDY, margin: 0 }}>
          بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </p>

        <p style={{ ...label, marginTop: 48 }}>Hosted by</p>
        <p style={{ fontFamily: SERIF, fontSize: 30, margin: "12px 0 0", color: INK }}>
          Mr. Abdul Jabbar &amp; Mrs. Shereena Jabbar
        </p>
        <p style={{ fontFamily: SANS, fontSize: 17, color: MUTED, margin: "6px 0 0" }}>
          Kunnumpurath House, Koorachundu, Kozhikode
        </p>

        <p
          style={{
            fontFamily: SERIF,
            fontSize: 24,
            color: MUTED,
            lineHeight: 1.55,
            margin: "44px auto 0",
            maxWidth: 620,
          }}
        >
          With joyful hearts, we request the honor of your presence at the wedding ceremony of our
          beloved son
        </p>

        <h2
          style={{
            fontFamily: SERIF,
            fontSize: 96,
            fontWeight: 500,
            color: BURGUNDY,
            margin: "40px 0 0",
            letterSpacing: "0.04em",
          }}
        >
          ADHIL
        </h2>
        <p style={lineage}>
          (Grand S/o. Hameed Haji &amp; (late) Sulaykha, Said Muhammed &amp; Sara)
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            margin: "44px 0",
          }}
        >
          <span style={{ height: 1, width: 90, background: "rgba(42,33,31,0.25)" }} />
          <span style={{ fontFamily: SCRIPT, fontSize: 52, color: GOLD, lineHeight: 1 }}>and</span>
          <span style={{ height: 1, width: 90, background: "rgba(42,33,31,0.25)" }} />
        </div>

        <h2
          style={{
            fontFamily: SERIF,
            fontSize: 96,
            fontWeight: 500,
            color: BURGUNDY,
            margin: 0,
            letterSpacing: "0.04em",
          }}
        >
          SAFA
        </h2>
        <p style={lineage}>(D/o. Mr. P.M. Basheer &amp; Mrs. Shameera Basheer)</p>

        <p dir="rtl" lang="ar" style={{ fontSize: 32, color: BURGUNDY, margin: "52px 0 0" }}>
          إن شاء الله
        </p>

        {/* event meta */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 0,
            marginTop: 48,
            paddingTop: 44,
            borderTop: `1px solid ${SAGE}`,
          }}
        >
          <div style={{ flex: 1, padding: "0 16px" }}>
            <p style={label}>When</p>
            <p style={{ fontFamily: SERIF, fontSize: 26, margin: "12px 0 0" }}>Saturday</p>
            <p style={{ fontFamily: SERIF, fontSize: 30, color: BURGUNDY, margin: "4px 0 0" }}>
              11
            </p>
            <p style={{ fontFamily: SERIF, fontSize: 20, color: MUTED, margin: 0 }}>July 2026</p>
            <p style={{ fontFamily: SANS, fontSize: 13, color: MUTED, margin: "4px 0 0" }}>
              26 Muharram 1448
            </p>
          </div>
          <div
            style={{
              flex: 1,
              padding: "0 16px",
              borderLeft: `1px solid ${SAGE}`,
              borderRight: `1px solid ${SAGE}`,
            }}
          >
            <p style={label}>Wedding</p>
            <p style={{ fontFamily: SERIF, fontSize: 32, margin: "12px 0 0" }}>12:30</p>
            <p style={{ fontFamily: SERIF, fontSize: 18, color: MUTED, margin: 0 }}>PM</p>
          </div>
          <div style={{ flex: 1, padding: "0 16px" }}>
            <p style={label}>Venue</p>
            <p style={{ fontFamily: SERIF, fontSize: 26, margin: "12px 0 0" }}>Hibas Auditorium</p>
            <p style={{ fontFamily: SANS, fontSize: 16, color: MUTED, margin: 0 }}>Koorachundu</p>
          </div>
        </div>

        {/* Sharing the happiness — mirrors the on-page card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            marginTop: 48,
            color: GOLD,
          }}
        >
          <span style={{ height: 1, width: 56, background: GOLD_SOFT }} />
          <svg width="20" height="20" viewBox="0 0 24 24" fill={GOLD}>
            <path
              d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z"
              opacity="0.85"
            />
          </svg>
          <span style={{ height: 1, width: 56, background: GOLD_SOFT }} />
        </div>
        <p style={{ ...label, marginTop: 22 }}>Sharing the happiness</p>
        <p style={{ fontFamily: SERIF, fontSize: 22, margin: "8px 0 0", color: INK }}>
          Muhammad Nidhil
        </p>

        <p style={{ fontFamily: SCRIPT, fontSize: 44, color: BURGUNDY, margin: "40px 0 0" }}>
          Adhil &amp; Safa
        </p>
        <p style={{ ...label, fontSize: 12, marginTop: 8 }}>
          Your presence and prayers are our greatest gift
        </p>
      </div>
    </div>
  );
}

function DownloadCardButton() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    const node = cardRef.current;
    if (!node || busy) return;
    setBusy(true);
    try {
      // make sure web fonts are loaded before capturing
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }
      const opts = { pixelRatio: 2.5, cacheBust: true, backgroundColor: IVORY };
      // First pass warms up font/image embedding; the second renders correctly.
      await toPng(node, opts);
      const dataUrl = await toPng(node, opts);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "adhil-safa-invitation.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Could not generate invitation image", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <OutlineButton onClick={handleDownload}>
        {busy ? "Preparing…" : "Download invitation"}
      </OutlineButton>
      {/* Rendered off-screen so html-to-image has a real, laid-out node to capture */}
      <div style={{ position: "fixed", top: 0, left: -99999, pointerEvents: "none" }} aria-hidden>
        <PrintableCard cardRef={cardRef} />
      </div>
    </>
  );
}

// Owns the <audio> element and exposes play/toggle + a live `playing` flag
// (driven by the element's own events, so the UI always matches reality).
function useBackgroundMusic() {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = ref.current;
    if (!audio) return;
    audio.volume = 0.35;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  const play = () => ref.current?.play().catch(() => {});
  const toggle = () => {
    const audio = ref.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };

  return { ref, playing, play, toggle };
}

// Floating mute/play toggle, bottom-right.
function MusicButton({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={playing ? "Mute music" : "Play music"}
      title={playing ? "Mute music" : "Play music"}
      className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--burgundy)]/40 bg-card/70 text-[color:var(--burgundy)] shadow-lg backdrop-blur transition-colors hover:bg-[color:var(--burgundy)] hover:text-primary-foreground"
    >
      {playing ? <Volume2 size={18} strokeWidth={1.5} /> : <VolumeX size={18} strokeWidth={1.5} />}
      {playing && (
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[color:var(--burgundy)]/20" />
      )}
    </button>
  );
}

// "Tap to open" cover. The opening tap is the user gesture browsers require to
// start audio, so music begins exactly when the guest enters the invitation.
function IntroOverlay({ onEnter }: { onEnter: () => void }) {
  const [closing, setClosing] = useState(false);
  const [gone, setGone] = useState(false);
  if (gone) return null;

  return (
    <div
      className={`bg-veil fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 text-center transition-opacity duration-700 ${
        closing ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      onTransitionEnd={() => closing && setGone(true)}
    >
      <p className="font-sans text-xs uppercase tracking-[0.45em] text-muted-foreground">
        Together with their families
      </p>
      <p className="mt-6 font-script text-6xl text-[color:var(--burgundy)] sm:text-7xl">
        Adhil &amp; Safa
      </p>
      <p className="mt-4 font-serif text-2xl sm:text-3xl">11 . 07 . 2026</p>
      <div className="mt-8">
        <Ornament />
      </div>
      <button
        type="button"
        onClick={() => {
          onEnter();
          setClosing(true);
        }}
        className="group relative mt-10 inline-block overflow-hidden border border-[color:var(--burgundy)] px-10 py-4 text-[11px] uppercase tracking-[0.3em] text-[color:var(--burgundy)] transition-colors duration-500 hover:text-primary-foreground"
      >
        <span className="relative z-10 flex items-center gap-2">
          <Music size={14} strokeWidth={1.5} /> Open Invitation
        </span>
        <span className="absolute inset-0 translate-y-full bg-[color:var(--burgundy)] transition-transform duration-500 ease-out group-hover:translate-y-0" />
      </button>
      <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        ♪ with music
      </p>
    </div>
  );
}

function Invitation() {
  const c = useCountdown();
  const [mapLoaded, setMapLoaded] = useState(false);
  const music = useBackgroundMusic();

  return (
    <main className="bg-veil min-h-screen text-foreground">
      <audio ref={music.ref} src="/wedding-music.mp3" loop preload="auto" />
      <IntroOverlay onEnter={music.play} />
      <MusicButton playing={music.playing} onToggle={music.toggle} />

      {/* HERO — Save the Date */}
      <section className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-20 text-center">
        <p className="font-sans text-xs uppercase tracking-[0.45em] text-muted-foreground animate-fade-up">
          Together with their families
        </p>
        <h1 className="mt-10 flex flex-col items-center font-serif leading-[0.85] tracking-tight">
          <span className="animate-fade-up delay-100 text-[18vw] sm:text-[10rem]">Save</span>
          <span className="font-script -mt-2 animate-fade-up delay-200 text-5xl text-[color:var(--burgundy)] sm:text-6xl">
            the
          </span>
          <span className="animate-fade-up delay-300 text-[18vw] sm:text-[10rem]">Date</span>
        </h1>

        <div className="mt-12 animate-fade-up delay-400">
          <Ornament />
          <p className="mt-6 font-serif text-3xl sm:text-4xl">11 . 07 . 2026</p>
          <p className="mt-2 font-sans text-sm uppercase tracking-[0.4em] text-muted-foreground">
            Saturday
          </p>
        </div>

        <a
          href="#invitation"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.4em] text-muted-foreground hover:text-foreground transition-colors"
        >
          Scroll ↓
        </a>
      </section>

      {/* COUPLE — Hands image */}
      <section className="relative mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center">
        <Reveal className="overflow-hidden rounded-sm shadow-2xl">
          <img
            src={hands}
            alt="Safa and Adhil holding hands with engagement ring"
            className="h-full w-full object-cover grayscale"
            loading="lazy"
          />
        </Reveal>
        <Reveal delay={150} className="text-center md:text-left">
          <p className="font-script text-4xl text-[color:var(--burgundy)]">the wedding of</p>
          <h2 className="mt-4 font-serif text-6xl sm:text-7xl">Adhil</h2>
          <p className="my-4 font-serif text-2xl italic text-muted-foreground">&amp;</p>
          <h2 className="font-serif text-6xl sm:text-7xl">Safa</h2>
          <div className="mt-8">
            <Ornament />
          </div>
          <p className="mt-6 font-serif text-xl leading-relaxed text-muted-foreground">
            “And among His signs is that He created for you mates from yourselves that you may find
            tranquility in them; and He placed between you affection and mercy.”
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.35em] text-muted-foreground">
            — Qur'an 30:21
          </p>
        </Reveal>
      </section>

      {/* INVITATION CARD */}
      <section id="invitation" className="px-6 py-24">
        <Reveal className="mx-auto max-w-3xl rounded-sm border border-[color:var(--sage)] bg-card/80 px-6 py-16 text-center shadow-xl backdrop-blur sm:px-14">
          <p dir="rtl" lang="ar" className="text-2xl text-[color:var(--burgundy)]">
            بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </p>

          <div className="mt-10">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Hosted by</p>
            <p className="mt-3 font-serif text-xl">Mr. Abdul Jabbar &amp; Mrs. Shereena Jabbar</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Kunnumpurath House, Koorachundu, Kozhikode
            </p>
          </div>

          <p className="mx-auto mt-10 max-w-xl font-serif text-lg leading-relaxed text-muted-foreground">
            With joyful hearts, we request the honor of your presence at the wedding ceremony of our
            beloved son
          </p>

          <h3 className="mt-8 font-serif text-7xl text-[color:var(--burgundy)] tracking-wide">
            ADHIL
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs italic text-muted-foreground">
            (Grand S/o. Hameed Haji &amp; (late) Sulaykha, Said Muhammed &amp; Sara)
          </p>

          <div className="my-10 flex items-center justify-center">
            <span className="h-px w-16 bg-foreground/30" />
            <span className="mx-4 font-script text-4xl text-[color:var(--gold)]">and</span>
            <span className="h-px w-16 bg-foreground/30" />
          </div>

          <h3 className="font-serif text-7xl text-[color:var(--burgundy)] tracking-wide">SAFA</h3>
          <p className="mx-auto mt-2 max-w-md text-xs italic text-muted-foreground">
            (D/o. Mr. P.M. Basheer &amp; Mrs. Shameera Basheer)
          </p>

          <p dir="rtl" lang="ar" className="mt-12 text-2xl text-[color:var(--burgundy)]">
            إن شاء الله
          </p>

          {/* Event meta */}
          <div className="mt-10 grid gap-8 border-t border-border pt-10 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">When</p>
              <p className="mt-3 font-serif text-2xl">Saturday</p>
              <p className="mt-1 font-serif text-3xl text-[color:var(--burgundy)]">11</p>
              <p className="font-serif text-xl text-muted-foreground">July 2026</p>
              <p className="mt-1 text-xs text-muted-foreground">26 Muharram 1448</p>
            </div>
            <div className="sm:border-x sm:border-border">
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Wedding</p>
              <p className="mt-3 font-serif text-3xl">12:30</p>
              <p className="font-serif text-base text-muted-foreground">PM</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Venue</p>
              <p className="mt-3 font-serif text-2xl">Hibas Auditorium</p>
              <p className="text-sm text-muted-foreground">Koorachundu</p>
            </div>
          </div>

          <div className="mt-12">
            <Ornament />
            <p className="mt-6 text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Sharing the happiness
            </p>
            <p className="mt-2 font-serif text-lg">Muhammad Nidhil</p>
          </div>
        </Reveal>
      </section>

      {/* ACTIONS — Download / Calendar / Share */}
      <section className="px-6 pb-4">
        <Reveal className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-4 text-center">
          <DownloadCardButton />
          <AddToCalendarButton />
          <ShareButton />
        </Reveal>
      </section>

      {/* COUNTDOWN */}
      <section className="px-6 py-20">
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="font-script text-4xl text-[color:var(--burgundy)]">counting the days</p>
          <h2 className="mt-2 font-serif text-4xl">Until we celebrate</h2>
          <div className="mt-10 grid grid-cols-4 gap-3 sm:gap-6">
            {[
              { v: c.days, l: "Days" },
              { v: c.hours, l: "Hours" },
              { v: c.minutes, l: "Minutes" },
              { v: c.seconds, l: "Seconds" },
            ].map((b) => (
              <div
                key={b.l}
                className="rounded-sm border border-[color:var(--sage)] bg-card/70 px-2 py-6 backdrop-blur"
              >
                <p className="font-serif text-4xl text-[color:var(--burgundy)] sm:text-6xl">
                  {String(b.v).padStart(2, "0")}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.35em] text-muted-foreground sm:text-xs">
                  {b.l}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* VENUE / MAP */}
      <section className="px-6 py-24">
        <Reveal className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="text-center">
            <span className="block text-[10px] uppercase tracking-[0.4em] text-[color:var(--gold)] font-sans">
              The Destination
            </span>
            <h2 className="mt-5 font-serif text-5xl sm:text-6xl">Hibas Auditorium</h2>
            <div className="mt-3 flex items-center justify-center gap-4">
              <span className="h-px w-10 bg-[color:var(--gold)]/40" />
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Koorachundu, Kozhikode, Kerala
              </p>
              <span className="h-px w-10 bg-[color:var(--gold)]/40" />
            </div>
          </div>

          {/* Map with decorative frame */}
          <div className="relative mt-14">
            {/* Outer shadow frame */}
            <div className="absolute -inset-3 border border-[color:var(--sage)]/40 rounded-sm pointer-events-none" />
            <div className="absolute -inset-1.5 border border-[color:var(--gold)]/20 rounded-sm pointer-events-none" />

            {/* Corner accents */}
            <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t border-l border-[color:var(--gold)]/50 pointer-events-none" />
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t border-r border-[color:var(--gold)]/50 pointer-events-none" />
            <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b border-l border-[color:var(--gold)]/50 pointer-events-none" />
            <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b border-r border-[color:var(--gold)]/50 pointer-events-none" />

            <div className="relative h-[420px] overflow-hidden rounded-sm border border-border shadow-2xl shadow-[color:var(--sage)]/20">
              {/* Placeholder shown until the embed loads (and as a fallback if it's blocked) */}
              <div
                aria-hidden
                className={`absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/60 transition-opacity duration-700 ${
                  mapLoaded ? "pointer-events-none opacity-0" : "opacity-100"
                }`}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  className="animate-pulse text-[color:var(--burgundy)]"
                >
                  <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                  Loading map…
                </p>
              </div>
              <iframe
                title="Hibas Auditorium, Koorachundu map"
                src="https://www.google.com/maps?q=Hibas+Auditorium+Koorachundu&output=embed"
                width="100%"
                height="420"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setMapLoaded(true)}
                className={`block h-full w-full transition-opacity duration-700 ${
                  mapLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-10 text-center">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Hibas+Auditorium+Koorachundu"
              target="_blank"
              rel="noreferrer"
              className="group relative inline-block overflow-hidden border border-[color:var(--burgundy)] px-10 py-4 text-[11px] uppercase tracking-[0.3em] text-[color:var(--burgundy)] transition-colors duration-500 hover:text-primary-foreground"
            >
              <span className="relative z-10">Open in Google Maps</span>
              <span className="absolute inset-0 bg-[color:var(--burgundy)] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            </a>
          </div>

          {/* Bottom divider */}
          <div className="mt-16 flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-[color:var(--gold)]/40" />
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-[color:var(--gold)]/50 rotate-45"
            >
              <rect x="4" y="4" width="16" height="16" rx="1" />
            </svg>
            <span className="h-px w-10 bg-[color:var(--gold)]/40" />
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border px-6 py-14 text-center">
        <Ornament />
        <p className="mt-6 font-script text-4xl text-[color:var(--burgundy)]">Adhil &amp; Safa</p>
        <p className="mt-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
          11 . 07 . 2026 · Hibas Auditorium, Koorachundu
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          Your presence and prayers are the greatest gift to us.
        </p>
      </footer>
    </main>
  );
}
