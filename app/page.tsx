"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type AppState = "landing" | "generating" | "result";
type RecipientGender = "female" | "male";

interface RecipientSettings {
  recipient_gender: RecipientGender;
  recipient_context: string;
  updated_at: string;
}

interface WeatherContext {
  condition: string;
  temp: string;
  mood: string;
}

interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

interface AppContext {
  day: string;
  timeOfDay: string;
  location: string;
  weather: WeatherContext;
  recentThemes: string[];
}

interface GenerateResponse {
  message: string;
  theme: string;
  tone: string;
  context: AppContext;
  tooSimilar: boolean;
}

interface HistoryItem {
  id: number;
  sent_at: string;
  message_text: string;
  theme: string | null;
  tone: string | null;
}

function weatherLabel(context: AppContext): string {
  const c = context.weather.condition.toUpperCase();
  const temp = context.weather.temp.replace("°C", "°C");
  return `${c} · ${temp}`;
}

function getDayShort(day: string): string {
  return day.slice(0, 3).toUpperCase();
}

function formatHistoryDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Africa/Accra",
    })
    .toUpperCase();
}

function IconCopy({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconZap({ className }: { className?: string }) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function IconArrow({ className }: { className?: string }) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

function LogoMark() {
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-bronze">
      <div className="h-px w-2 bg-bronze" />
    </div>
  );
}

function SettingsForm({
  initialGender,
  initialContext,
  onSave,
  saving,
  submitLabel,
  isSettings,
}: {
  initialGender: RecipientGender;
  initialContext: string;
  onSave: (gender: RecipientGender, context: string) => void;
  saving: boolean;
  submitLabel: string;
  isSettings?: boolean;
}) {
  const [gender, setGender] = useState<RecipientGender>(initialGender);
  const [context, setContext] = useState(initialContext);

  return (
    <div className="flex flex-col gap-6 p-6">
      {!isSettings && (
        <p className="text-sm leading-relaxed text-champagne">
          Two things and you&apos;re in. Companion uses this to make every
          message feel personal.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <label className="font-mono text-[10px] tracking-[0.2em] text-champagne">
          WRITING FOR
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["female", "male"] as RecipientGender[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`py-3 font-display text-[11px] font-bold tracking-[0.08em] transition-all ${
                gender === g
                  ? "border border-stone bg-stone text-graphite"
                  : "border border-medium bg-transparent text-champagne"
              }`}
            >
              {g === "female" ? "HER" : "HIM"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="font-mono text-[10px] tracking-[0.2em] text-champagne">
          ABOUT THEM
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={4}
          placeholder="How long you've been together, what they love, what to avoid — whatever makes the messages feel like you."
          className="w-full resize-none border border-[rgba(220,207,192,0.15)] bg-input px-4 py-3.5 text-[15px] leading-relaxed text-white outline-none transition-colors focus:border-bronze/50"
        />
      </div>

      <button
        onClick={() => onSave(gender, context)}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 bg-stone py-4 font-display text-xs font-black tracking-[0.06em] text-graphite transition-opacity hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
      >
        {saving ? "SAVING…" : submitLabel}
        <IconArrow />
      </button>
    </div>
  );
}

function EditorialPanel({ historyCount }: { historyCount: number }) {
  return (
    <div className="relative hidden flex-col overflow-hidden bg-photo md:flex">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&h=1100&fit=crop&auto=format&q=80"
          alt="Warm editorial — journal and morning light"
          fill
          className="object-cover opacity-45"
          sizes="50vw"
          priority
        />
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

      <div
        className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-display text-[clamp(4rem,9vw,8rem)] font-black leading-none tracking-[-0.05em] text-stone/[0.04]"
        aria-hidden
      >
        FEEL.
      </div>

      <div className="absolute bottom-9 right-8 text-right font-mono text-[9px] leading-[1.8] tracking-[0.2em] text-champagne/35">
        COMPANION
        <br />
        V1.0
      </div>

      <div className="absolute bottom-0 left-0 right-0 grid grid-cols-3 border-t border-subtle">
        {[
          { label: "MESSAGES SENT", value: historyCount.toString().padStart(2, "0") },
          { label: "NO DATA SENT", value: "✓" },
          { label: "DEVICE ONLY", value: "✓" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`p-5 ${i < 2 ? "border-r border-subtle" : ""}`}
          >
            <div className="mb-1 font-display text-[1.375rem] font-black text-bronze">
              {stat.value}
            </div>
            <div className="font-mono text-[9px] tracking-[0.15em] text-champagne/60">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [settings, setSettings] = useState<RecipientSettings | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [appState, setAppState] = useState<AppState>("landing");
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState("");
  const [tone, setTone] = useState("");
  const [context, setContext] = useState<AppContext | null>(null);
  const [tooSimilar, setTooSimilar] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [messagesSent, setMessagesSent] = useState(0);
  const [userCoords, setUserCoords] = useState<GeoCoordinates | null>(null);

  const panelOpen = historyOpen || showOnboarding || showSettings;

  useEffect(() => {
    document.body.style.overflow = panelOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [panelOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setHistoryOpen(false);
        setShowSettings(false);
        if (settings) setShowOnboarding(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settings]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        const s = data.settings ?? null;
        setSettings(s);
        if (!s) setShowOnboarding(true);
      }
    } catch {
      setShowOnboarding(true);
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/save", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.messages ?? []);
        if (typeof data.total === "number") {
          setMessagesSent(data.total);
        }
      }
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchHistory();
  }, [fetchSettings, fetchHistory]);

  useEffect(() => {
    if (!settingsLoaded || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        // Permission denied or unavailable — server falls back to default area
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 900000,
      }
    );
  }, [settingsLoaded]);

  const saveSettings = async (gender: RecipientGender, context: string) => {
    setSavingSettings(true);
    setError("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_gender: gender,
          recipient_context: context,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");

      setSettings(data.settings);
      setShowOnboarding(false);
      setShowSettings(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const generate = async () => {
    if (!settings) {
      setShowOnboarding(true);
      return;
    }

    setAppState("generating");
    setError("");
    setTooSimilar(false);
    setCopied(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userCoords ?? {}),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      const result = data as GenerateResponse;
      setMessage(result.message);
      setTheme(result.theme);
      setTone(result.tone);
      setContext(result.context);
      setTooSimilar(result.tooSimilar);
      setAppState("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAppState(settings ? "landing" : "landing");
    }
  };

  const handleCopy = async () => {
    if (!message) return;

    try {
      await navigator.clipboard.writeText(message);
    } catch {
      setError("Failed to copy to clipboard");
      return;
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_text: message, theme, tone }),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      if (Array.isArray(data.messages)) {
        setHistory(data.messages);
      }
      if (typeof data.total === "number") {
        setMessagesSent(data.total);
      } else {
        await fetchHistory();
      }
    } catch {
      setError("Copied, but failed to update message history");
    }
  };

  if (!settingsLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite">
        <div className="h-2 w-2 animate-pulse-dot rounded-full bg-bronze" />
      </div>
    );
  }

  const footerHint =
    appState === "landing"
      ? "NO ACCOUNT · NO SEND · JUST WORDS"
      : appState === "result"
        ? "PASTE INTO WHATSAPP YOURSELF"
        : "CRAFTING YOUR MESSAGE...";

  const ctaLabel =
    appState === "generating"
      ? "WRITING..."
      : appState === "result"
        ? "NEW MESSAGE"
        : "GENERATE MESSAGE";

  return (
    <div className="relative min-h-screen overflow-hidden bg-graphite text-white">
      {/* NAV */}
      <nav className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-subtle px-6 py-5">
        <div className="flex items-center gap-3">
          <LogoMark />
          <span className="font-mono text-sm tracking-[0.25em] text-white/70">
            COMPANION
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] text-champagne transition-colors hover:text-white"
          >
            <IconClock />
            HISTORY
          </button>
          <button
            onClick={openSettings}
            className="text-champagne transition-colors hover:text-white"
            aria-label="Settings"
          >
            <IconSettings />
          </button>
        </div>
      </nav>

      {/* SPLIT LAYOUT */}
      <div className="grid min-h-screen grid-cols-1 pt-[68px] md:grid-cols-2">
        {/* LEFT */}
        <div className="flex flex-col justify-between border-r border-subtle p-8 md:p-10 lg:p-16">
          <div className="mt-6 md:mt-10">
            {appState === "landing" && (
              <div className="animate-fade-up">
                <div className="font-display text-[clamp(2.8rem,6.5vw,5.5rem)] font-black leading-[0.92] tracking-[-0.03em] text-white">
                  WRITE
                  <br />
                  WHAT
                  <br />
                  YOU
                  <br />
                  <span className="text-bronze">TRULY</span>
                  <br />
                  FEEL.
                </div>
                <p className="mt-8 max-w-xs text-[15px] leading-relaxed text-champagne">
                  Thoughtful messages crafted for the people who matter most.
                </p>
              </div>
            )}

            {appState === "generating" && (
              <div className="animate-fade-in flex flex-col gap-6 pt-4">
                <div className="font-display text-[clamp(1.6rem,3.5vw,3rem)] font-black leading-none tracking-[-0.03em] text-white/25">
                  WRITING
                  <br />
                  SOMETHING
                  <br />
                  REAL...
                </div>
                <div className="mt-4 flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-2 w-2 animate-pulse-dot bg-bronze"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {appState === "result" && message && (
              <div className="animate-fade-up flex flex-col gap-6">
                {context && (
                  <div className="inline-flex w-fit items-center gap-2 border border-medium px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-champagne">
                    {weatherLabel(context)} · {context.location.toUpperCase()} · {getDayShort(context.day)}
                  </div>
                )}

                <div className="border-t border-[rgba(220,207,192,0.15)] pt-6">
                  <p className="max-w-sm text-lg leading-relaxed text-white">
                    {message}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="bg-bronze px-2.5 py-1 font-mono text-[10px] tracking-[0.15em] text-white">
                    {theme.toUpperCase()}
                  </span>
                  <span className="border border-[rgba(220,207,192,0.25)] px-2.5 py-1 font-mono text-[10px] tracking-[0.15em] text-champagne">
                    {tone.toUpperCase()}
                  </span>
                </div>

                {tooSimilar && (
                  <p className="text-sm text-champagne">
                    Feels similar to a recent message — try regenerating.
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="mt-6 text-sm text-red-400">{error}</p>
            )}
          </div>

          {/* ACTIONS */}
          <div className="mt-10 flex flex-col gap-4">
            {appState === "result" && (
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 bg-stone px-5 py-3 font-mono text-[11px] tracking-[0.1em] text-graphite transition-opacity hover:opacity-80 active:scale-[0.98]"
                >
                  {copied ? <IconCheck /> : <IconCopy />}
                  {copied ? "COPIED" : "COPY"}
                </button>
                <button
                  onClick={generate}
                  className="flex items-center gap-2 border border-medium px-5 py-3 font-mono text-[11px] tracking-[0.1em] text-champagne transition-colors hover:border-champagne/50"
                >
                  <IconRefresh />
                  REGENERATE
                </button>
              </div>
            )}

            <button
              onClick={generate}
              disabled={appState === "generating"}
              className="group flex w-fit items-center gap-3 bg-stone px-7 py-3.5 font-display text-xs font-black tracking-[0.05em] text-graphite transition-opacity hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IconZap />
              {ctaLabel}
              <IconArrow className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>

            <p className="font-mono text-[9.6px] tracking-[0.12em] text-champagne/50">
              {footerHint}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <EditorialPanel historyCount={messagesSent} />
      </div>

      {/* HISTORY */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 animate-fade-in bg-graphite/80 backdrop-blur-sm"
            onClick={() => setHistoryOpen(false)}
          />
          <aside className="animate-slide-in-right relative flex h-full w-full max-w-md flex-col border-l border-subtle bg-panel">
            <div className="flex items-center justify-between border-b border-subtle p-6">
              <span className="font-mono text-[11px] tracking-[0.2em] text-white">
                SENT MESSAGES
              </span>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-champagne transition-colors hover:text-white"
              >
                <IconX />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-medium">
                    <IconClock className="text-champagne" />
                  </div>
                  <p className="text-sm text-champagne">
                    Messages you copy will appear here.
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-[rgba(220,207,192,0.08)] p-6"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-mono text-[9px] tracking-[0.15em] text-bronze">
                        {(item.theme ?? "").toUpperCase()}
                      </span>
                      <span className="font-mono text-[9px] text-champagne/50">
                        {formatHistoryDate(item.sent_at)}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-sm leading-relaxed text-white/75">
                      {item.message_text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ONBOARDING / SETTINGS */}
      {(showOnboarding || showSettings) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 animate-fade-in bg-graphite/92 backdrop-blur-sm"
            onClick={showSettings ? () => setShowSettings(false) : undefined}
          />
          <div className="animate-fade-up relative w-full max-w-[480px] border border-[rgba(220,207,192,0.12)] bg-panel">
            <div className="flex items-center justify-between border-b border-subtle p-6">
              <span className="font-mono text-[11px] tracking-[0.2em] text-white">
                {showSettings ? "SETTINGS" : "GET STARTED"}
              </span>
              {showSettings && (
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-champagne transition-colors hover:text-white"
                >
                  <IconX />
                </button>
              )}
            </div>
            <SettingsForm
              initialGender={settings?.recipient_gender ?? "female"}
              initialContext={settings?.recipient_context ?? ""}
              onSave={saveSettings}
              saving={savingSettings}
              submitLabel={showSettings ? "SAVE" : "LET'S GO"}
              isSettings={showSettings}
            />
            {error && (
              <p className="px-6 pb-6 text-sm text-red-400">{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
