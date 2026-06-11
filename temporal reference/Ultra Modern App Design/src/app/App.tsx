import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Copy, RefreshCw, Clock, Settings, X, Check, ArrowUpRight, Zap } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

// Palette
// Graphite  #181818  — background
// Bronze    #8B7355  — accent, tags, logo mark
// Champagne #DCCFC0  — muted text, borders
// Stone     #F5F1EA  — primary CTA, high-contrast surfaces
// White     #FFFFFF  — body text

type AppState = "landing" | "generating" | "result";
type Gender = "her" | "him";

interface Profile {
  gender: Gender;
  context: string;
}

interface SavedMessage {
  id: string;
  text: string;
  theme: string;
  tone: string;
  date: string;
}

const MESSAGES_HER = [
  {
    text: "Good morning. I was thinking about the way you laugh at your own jokes before you even finish them — it's one of my favourite things about you. Have a brilliant day.",
    theme: "TENDERNESS",
    tone: "WARM",
  },
  {
    text: "It's raining in Accra and I keep thinking about you. Some days the quiet moments feel the loudest. Missing you today.",
    theme: "LONGING",
    tone: "INTIMATE",
  },
  {
    text: "You were the first thing I thought about this morning. That says everything I can't always find words for.",
    theme: "DEVOTION",
    tone: "AFFECTIONATE",
  },
  {
    text: "I don't say it enough, but watching you move through the world so confidently — it moves me every time.",
    theme: "ADMIRATION",
    tone: "SINCERE",
  },
  {
    text: "Thursday again. The week goes faster when I know the weekend means you. I love you more than I say out loud.",
    theme: "GRATITUDE",
    tone: "TENDER",
  },
];

const MESSAGES_HIM = [
  {
    text: "Morning. Was lying here thinking about you before I even opened my eyes. Good days feel better when you're in them.",
    theme: "DEVOTION",
    tone: "WARM",
  },
  {
    text: "You've been on my mind all day and I wanted you to know it. Nothing specific — just you.",
    theme: "LONGING",
    tone: "INTIMATE",
  },
  {
    text: "I love watching you figure things out. The way your brain works is one of my favourite things about you.",
    theme: "ADMIRATION",
    tone: "SINCERE",
  },
  {
    text: "Rain in Accra and I keep reaching for my phone to tell you something, then realising I just miss you. So — hi. I miss you.",
    theme: "TENDERNESS",
    tone: "PLAYFUL",
  },
];

const WEATHER_OPTIONS = [
  "☀ SUNNY · 31°C",
  "⛅ PARTLY CLOUDY · 28°C",
  "🌧 RAINY · 26°C",
  "🌤 BREEZY · 29°C",
];

function getDay() {
  return ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][new Date().getDay()];
}

function formatDate(date: Date) {
  return date
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentMessage, setCurrentMessage] = useState<{ text: string; theme: string; tone: string } | null>(null);
  const [history, setHistory] = useState<SavedMessage[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [weather] = useState(WEATHER_OPTIONS[Math.floor(Math.random() * WEATHER_OPTIONS.length)]);

  const [draftGender, setDraftGender] = useState<Gender>("her");
  const [draftContext, setDraftContext] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("companion_profile");
    const savedHistory = localStorage.getItem("companion_history");
    if (saved) setProfile(JSON.parse(saved));
    else setShowOnboarding(true);
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const saveProfile = () => {
    const p: Profile = { gender: draftGender, context: draftContext };
    setProfile(p);
    localStorage.setItem("companion_profile", JSON.stringify(p));
    setShowOnboarding(false);
    setShowSettings(false);
  };

  const openSettings = () => {
    if (profile) {
      setDraftGender(profile.gender);
      setDraftContext(profile.context);
    }
    setShowSettings(true);
  };

  const generate = useCallback(async () => {
    if (!profile) { setShowOnboarding(true); return; }
    setAppState("generating");
    setCurrentMessage(null);
    await new Promise((r) => setTimeout(r, 2200));
    const pool = profile.gender === "her" ? MESSAGES_HER : MESSAGES_HIM;
    const msg = pool[Math.floor(Math.random() * pool.length)];
    setCurrentMessage(msg);
    setAppState("result");
  }, [profile]);

  const copyMessage = () => {
    if (!currentMessage) return;
    navigator.clipboard.writeText(currentMessage.text);
    const saved: SavedMessage = {
      id: Date.now().toString(),
      text: currentMessage.text,
      theme: currentMessage.theme,
      tone: currentMessage.tone,
      date: formatDate(new Date()),
    };
    const updated = [saved, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem("companion_history", JSON.stringify(updated));
    setCopied(true);
    toast("Copied — paste it into WhatsApp.", { duration: 2000 });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="size-full overflow-hidden relative"
      style={{ background: "#181818", color: "#FFFFFF", fontFamily: "'DM Sans', sans-serif" }}
    >
      <Toaster theme="dark" />

      {/* NAV */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-5"
        style={{ borderBottom: "1px solid rgba(220,207,192,0.1)" }}
      >
        <div className="flex items-center gap-3">
          {/* Logo mark: circle with horizontal stroke */}
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ border: "1.5px solid #8B7355" }}
          >
            <div className="w-2 h-px" style={{ background: "#8B7355" }} />
          </div>
          <span
            className="text-sm"
            style={{
              fontFamily: "'Space Mono', monospace",
              letterSpacing: "0.25em",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            COMPANION
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 transition-colors"
            style={{
              fontFamily: "'Space Mono', monospace",
              letterSpacing: "0.1em",
              fontSize: "0.6875rem",
              color: "#DCCFC0",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#DCCFC0")}
          >
            <Clock size={11} />
            HISTORY
          </button>
          <button
            onClick={openSettings}
            style={{ color: "#DCCFC0" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#DCCFC0")}
            className="transition-colors"
          >
            <Settings size={14} />
          </button>
        </div>
      </nav>

      {/* MAIN SPLIT LAYOUT */}
      <div
        className="size-full pt-[68px] grid min-h-screen"
        style={{ gridTemplateColumns: "1fr 1fr" }}
      >
        {/* LEFT */}
        <div
          className="flex flex-col justify-between p-10 lg:p-16"
          style={{ borderRight: "1px solid rgba(220,207,192,0.1)" }}
        >
          <div className="mt-6 md:mt-10">
            <AnimatePresence mode="wait">
              {appState === "landing" && (
                <motion.div
                  key="hero"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* MASSIVE STACKED HEADLINE */}
                  <div
                    style={{
                      fontFamily: "'Unbounded', sans-serif",
                      fontWeight: 900,
                      fontSize: "clamp(2.8rem, 6.5vw, 5.5rem)",
                      lineHeight: 0.92,
                      letterSpacing: "-0.03em",
                      color: "#FFFFFF",
                    }}
                  >
                    WRITE<br />
                    WHAT<br />
                    YOU<br />
                    <span style={{ color: "#8B7355" }}>TRULY</span><br />
                    FEEL.
                  </div>

                  <p
                    className="mt-8 leading-relaxed max-w-xs"
                    style={{ color: "#DCCFC0", fontSize: "0.9375rem" }}
                  >
                    Thoughtful messages crafted for the people who matter most.
                  </p>
                </motion.div>
              )}

              {appState === "generating" && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-6 pt-4"
                >
                  <div
                    style={{
                      fontFamily: "'Unbounded', sans-serif",
                      fontWeight: 900,
                      fontSize: "clamp(1.6rem, 3.5vw, 3rem)",
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                      color: "rgba(255,255,255,0.25)",
                    }}
                  >
                    WRITING<br />
                    SOMETHING<br />
                    REAL...
                  </div>
                  <div className="flex gap-1.5 mt-4">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        style={{ background: "#8B7355", width: 8, height: 8 }}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {appState === "result" && currentMessage && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-6"
                >
                  {/* WEATHER CAPSULE */}
                  <div
                    className="inline-flex items-center gap-2 w-fit px-3 py-1.5"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "0.6875rem",
                      color: "#DCCFC0",
                      border: "1px solid rgba(220,207,192,0.2)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {weather} · ACCRA · {getDay()}
                  </div>

                  {/* MESSAGE */}
                  <div
                    style={{ borderTop: "1px solid rgba(220,207,192,0.15)", paddingTop: "1.5rem" }}
                  >
                    <p
                      className="leading-relaxed max-w-sm"
                      style={{ fontSize: "1.125rem", color: "#FFFFFF" }}
                    >
                      {currentMessage.text}
                    </p>
                  </div>

                  {/* THEME / TONE TAGS */}
                  <div className="flex gap-2 flex-wrap">
                    <span
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "0.625rem",
                        letterSpacing: "0.15em",
                        background: "#8B7355",
                        color: "#FFFFFF",
                        padding: "4px 10px",
                      }}
                    >
                      {currentMessage.theme}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "0.625rem",
                        letterSpacing: "0.15em",
                        border: "1px solid rgba(220,207,192,0.25)",
                        color: "#DCCFC0",
                        padding: "4px 10px",
                      }}
                    >
                      {currentMessage.tone}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ACTION ROW */}
          <div className="flex flex-col gap-4 mt-10">
            {appState === "result" && (
              <div className="flex gap-3">
                <button
                  onClick={copyMessage}
                  className="flex items-center gap-2 px-5 py-3 transition-opacity hover:opacity-80 active:scale-[0.98]"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.1em",
                    background: "#F5F1EA",
                    color: "#181818",
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "COPIED" : "COPY"}
                </button>
                <button
                  onClick={generate}
                  className="flex items-center gap-2 px-5 py-3 transition-colors"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.1em",
                    border: "1px solid rgba(220,207,192,0.2)",
                    color: "#DCCFC0",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(220,207,192,0.5)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(220,207,192,0.2)")}
                >
                  <RefreshCw size={12} />
                  REGENERATE
                </button>
              </div>
            )}

            {/* PRIMARY CTA */}
            <button
              onClick={generate}
              disabled={appState === "generating"}
              className="group flex items-center gap-3 transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed w-fit"
              style={{
                fontFamily: "'Unbounded', sans-serif",
                fontWeight: 900,
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
                background: "#F5F1EA",
                color: "#181818",
                padding: "14px 28px",
              }}
            >
              <Zap size={13} className="shrink-0" />
              {appState === "generating"
                ? "WRITING..."
                : appState === "result"
                ? "NEW MESSAGE"
                : "GENERATE MESSAGE"}
              <ArrowUpRight
                size={13}
                className="shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </button>

            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.6rem",
                letterSpacing: "0.12em",
                color: "rgba(220,207,192,0.5)",
              }}
            >
              {appState === "landing"
                ? "NO ACCOUNT · NO SEND · JUST WORDS"
                : appState === "result"
                ? "PASTE INTO WHATSAPP YOURSELF"
                : "CRAFTING YOUR MESSAGE..."}
            </p>
          </div>
        </div>

        {/* RIGHT — EDITORIAL PHOTO PANEL */}
        <div className="hidden md:flex flex-col relative overflow-hidden" style={{ background: "#111111" }}>
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&h=1100&fit=crop&auto=format&q=80"
              alt="Warm editorial — journal and morning light"
              className="w-full h-full object-cover"
              style={{ opacity: 0.45 }}
            />
            {/* Graphite gradient overlays */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, #181818 0%, rgba(24,24,24,0.15) 50%, transparent 100%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(24,24,24,0.5) 0%, transparent 60%)",
              }}
            />
          </div>

          {/* GHOST DISPLAY TEXT */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            style={{
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(4rem,9vw,8rem)",
              lineHeight: 1,
              letterSpacing: "-0.05em",
              color: "rgba(245,241,234,0.04)",
            }}
          >
            FEEL.
          </div>

          {/* BOTTOM LABEL */}
          <div
            className="absolute bottom-9 right-8 text-right"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.5625rem",
              letterSpacing: "0.2em",
              color: "rgba(220,207,192,0.35)",
              lineHeight: 1.8,
            }}
          >
            COMPANION<br />
            V1.0 · ACCRA
          </div>

          {/* STAT STRIP */}
          <div
            className="absolute bottom-0 left-0 right-0 grid grid-cols-3"
            style={{ borderTop: "1px solid rgba(220,207,192,0.1)" }}
          >
            {[
              { label: "MESSAGES SENT", value: history.length.toString().padStart(2, "0") },
              { label: "NO DATA SENT", value: "✓" },
              { label: "DEVICE ONLY", value: "✓" },
            ].map((s, i) => (
              <div
                key={s.label}
                className="p-5"
                style={{
                  borderRight: i < 2 ? "1px solid rgba(220,207,192,0.1)" : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Unbounded', sans-serif",
                    fontWeight: 900,
                    fontSize: "1.375rem",
                    color: "#8B7355",
                    marginBottom: "4px",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "0.5625rem",
                    letterSpacing: "0.15em",
                    color: "#DCCFC0",
                    opacity: 0.6,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HISTORY PANEL */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(24,24,24,0.8)", backdropFilter: "blur(4px)" }}
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col"
              style={{ background: "#1e1e1e", borderLeft: "1px solid rgba(220,207,192,0.1)" }}
            >
              <div
                className="flex items-center justify-between p-6"
                style={{ borderBottom: "1px solid rgba(220,207,192,0.1)" }}
              >
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.2em",
                    color: "#FFFFFF",
                  }}
                >
                  SENT MESSAGES
                </span>
                <button
                  onClick={() => setShowHistory(false)}
                  style={{ color: "#DCCFC0" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#DCCFC0")}
                  className="transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ border: "1px solid rgba(220,207,192,0.2)" }}
                    >
                      <Clock size={13} style={{ color: "#DCCFC0" }} />
                    </div>
                    <p style={{ color: "#DCCFC0", fontSize: "0.875rem" }}>
                      Messages you copy will appear here.
                    </p>
                  </div>
                ) : (
                  history.map((msg, i) => (
                    <div
                      key={msg.id}
                      className="p-6"
                      style={{ borderBottom: "1px solid rgba(220,207,192,0.08)" }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            fontSize: "0.5625rem",
                            letterSpacing: "0.15em",
                            color: "#8B7355",
                          }}
                        >
                          {msg.theme}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            fontSize: "0.5625rem",
                            color: "rgba(220,207,192,0.5)",
                          }}
                        >
                          {msg.date}
                        </span>
                      </div>
                      <p
                        className="leading-relaxed line-clamp-3"
                        style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.75)" }}
                      >
                        {msg.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ONBOARDING / SETTINGS OVERLAY */}
      <AnimatePresence>
        {(showOnboarding || showSettings) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(24,24,24,0.92)", backdropFilter: "blur(6px)" }}
              onClick={showSettings ? () => setShowSettings(false) : undefined}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 top-1/2 -translate-y-1/2 z-50 w-full md:w-[480px]"
              style={{ background: "#1e1e1e", border: "1px solid rgba(220,207,192,0.12)" }}
            >
              <div
                className="flex items-center justify-between p-6"
                style={{ borderBottom: "1px solid rgba(220,207,192,0.1)" }}
              >
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.2em",
                    color: "#FFFFFF",
                  }}
                >
                  {showSettings ? "SETTINGS" : "GET STARTED"}
                </span>
                {showSettings && (
                  <button
                    onClick={() => setShowSettings(false)}
                    style={{ color: "#DCCFC0" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#DCCFC0")}
                    className="transition-colors"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="p-6 flex flex-col gap-6">
                {!showSettings && (
                  <p style={{ fontSize: "0.875rem", color: "#DCCFC0", lineHeight: 1.65 }}>
                    Two things and you're in. Companion uses this to make every message feel personal.
                  </p>
                )}

                {/* GENDER TOGGLE */}
                <div className="flex flex-col gap-3">
                  <label
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "0.625rem",
                      letterSpacing: "0.2em",
                      color: "#DCCFC0",
                    }}
                  >
                    WRITING FOR
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["her", "him"] as Gender[]).map((g) => (
                      <button
                        key={g}
                        onClick={() => setDraftGender(g)}
                        className="py-3 transition-all"
                        style={{
                          fontFamily: "'Unbounded', sans-serif",
                          fontWeight: 700,
                          fontSize: "0.6875rem",
                          letterSpacing: "0.08em",
                          background: draftGender === g ? "#F5F1EA" : "transparent",
                          color: draftGender === g ? "#181818" : "#DCCFC0",
                          border:
                            draftGender === g
                              ? "1px solid #F5F1EA"
                              : "1px solid rgba(220,207,192,0.2)",
                        }}
                      >
                        {g === "her" ? "HER" : "HIM"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CONTEXT TEXTAREA */}
                <div className="flex flex-col gap-3">
                  <label
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "0.625rem",
                      letterSpacing: "0.2em",
                      color: "#DCCFC0",
                    }}
                  >
                    ABOUT THEM
                  </label>
                  <textarea
                    value={draftContext}
                    onChange={(e) => setDraftContext(e.target.value)}
                    rows={4}
                    placeholder="How long you've been together, what they love, what to avoid — whatever makes the messages feel like you."
                    className="w-full resize-none outline-none transition-colors"
                    style={{
                      background: "#222222",
                      color: "#FFFFFF",
                      border: "1px solid rgba(220,207,192,0.15)",
                      padding: "14px 16px",
                      fontSize: "0.9375rem",
                      lineHeight: 1.6,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(139,115,85,0.5)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(220,207,192,0.15)")}
                  />
                </div>

                {/* SUBMIT */}
                <button
                  onClick={saveProfile}
                  className="flex items-center justify-center gap-2 w-full py-4 transition-opacity hover:opacity-90 active:scale-[0.99]"
                  style={{
                    fontFamily: "'Unbounded', sans-serif",
                    fontWeight: 900,
                    fontSize: "0.75rem",
                    letterSpacing: "0.06em",
                    background: "#F5F1EA",
                    color: "#181818",
                  }}
                >
                  {showSettings ? "SAVE" : "LET'S GO"}
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
