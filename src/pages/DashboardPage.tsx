import { useMemo, useState } from "react"
import { Link } from "react-router-dom"

import {
  AudioLines,
  FileText,
  History,
  LayoutDashboard,
  MessageSquare,
  PlayCircle,
  Rocket,
  Settings,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { VIDEO_URL } from "@/lib/constants"

const MODULES = [
  {
    key: "process",
    title: "Video Processing",
    icon: PlayCircle,
    description: "Paste a YouTube URL and run the full analysis pipeline.",
    bullets: ["Link ingestion", "Fallback transcript extraction", "Metadata capture"],
    emptyState:
      "Upload a YouTube video URL to begin processing. Once complete, transcript, summary, and audio modules will unlock here.",
  },
  {
    key: "transcript",
    title: "Transcript Viewer",
    icon: FileText,
    description: "Inspect full transcript, search sections, and review timestamps.",
    bullets: ["Search transcript", "Timestamp chunks", "Copy and export text"],
    emptyState:
      "Process your first video to load transcript blocks and timestamp navigation in this workspace.",
  },
  {
    key: "summary",
    title: "AI Summary",
    icon: Sparkles,
    description: "Generate short, detailed, and key-point summaries from content.",
    bullets: ["Short summary", "Detailed summary", "Key insights"],
    emptyState:
      "Upload a video to see the AI Summary magic happen with concise, detailed, and key insight views.",
  },
  {
    key: "voice",
    title: "Voice Narration",
    icon: AudioLines,
    description: "Convert summary output to natural speech and playback audio.",
    bullets: ["Generate TTS", "Audio playback", "Download narration"],
    emptyState:
      "Once a summary is available, generate natural voice narration and preview it right here.",
  },
  {
    key: "qa",
    title: "Q&A Assistant",
    icon: MessageSquare,
    description: "Ask context-aware questions directly from processed transcripts.",
    bullets: ["Prompt input", "Context answers", "Session tracking"],
    emptyState:
      "Ask direct questions after processing a video and get answers grounded in transcript context.",
  },
  {
    key: "history",
    title: "History",
    icon: History,
    description: "Reopen and manage all previously analyzed videos.",
    bullets: ["Recent items", "Saved sessions", "Re-run analysis"],
    emptyState:
      "Your completed analyses will appear here for quick reopen and reuse across modules.",
  },
  {
    key: "settings",
    title: "Settings",
    icon: Settings,
    description: "Control summary mode, language, and workflow preferences.",
    bullets: ["Summary length", "Language", "TTS preferences"],
    emptyState:
      "Set default summary style, output language, and narration preferences for future runs.",
  },
] as const

export default function DashboardPage() {
  const [activeModule, setActiveModule] = useState<(typeof MODULES)[number]["key"]>("process")

  const selectedModule = useMemo(
    () => MODULES.find((module) => module.key === activeModule) ?? MODULES[0],
    [activeModule],
  )

  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <video autoPlay loop muted playsInline className="absolute inset-0 z-0 h-full w-full object-cover">
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(7,16,28,0.34)_0%,rgba(7,16,28,0.18)_40%,rgba(7,16,28,0.3)_100%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl shrink-0 items-center justify-between px-8 py-4">
        <Link className="text-3xl tracking-tight text-foreground" style={{ fontFamily: "'Instrument Serif', serif" }} to="/">
          Eduscribe.
        </Link>

        <div className="flex items-center gap-3">
          <Button asChild variant="liquid" className="rounded-full px-6 py-2.5 text-sm hover:scale-[1.03]">
            <Link to="/">Home</Link>
          </Button>
          <Button asChild variant="liquid" className="rounded-full px-6 py-2.5 text-sm hover:scale-[1.03]">
            <Link to="/signin">Sign In</Link>
          </Button>
        </div>
      </div>

      <div className="relative z-10 mx-auto hidden w-full max-w-7xl items-center justify-center px-6 pb-1 pt-1 lg:flex">
        <nav className="liquid-glass absolute left-1/2 flex -translate-x-1/2 items-center justify-center gap-2 rounded-full px-3 py-2">
          {MODULES.map((module) => {
            const Icon = module.icon
            const isActive = module.key === activeModule

            return (
              <button
                key={module.key}
                type="button"
                onClick={() => setActiveModule(module.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all ${
                  isActive
                    ? "bg-white/18 text-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]"
                    : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {module.title}
              </button>
            )
          })}
        </nav>
      </div>

      <section className="dashboard-surface relative z-10 mx-auto flex-1 min-h-0 w-full max-w-7xl px-6 pb-3 pt-3">
        <div className="grid h-full min-h-0 grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
          <aside className="liquid-glass animate-fade-rise flex h-full min-h-0 flex-col rounded-[28px] px-4 py-5">
            <div className="border-b border-white/20 pb-4 text-center">
              <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                <LayoutDashboard className="h-5 w-5 text-foreground" />
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
              <h2 className="mt-1 text-2xl text-foreground" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Dashboard
              </h2>
            </div>

            <div className="sidebar-rail mt-4 space-y-3 pt-3">
              <article className="rounded-2xl border border-white/20 bg-white/10 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Session Pulse</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-[hsl(0_0%_92%)]">
                  <span className="status-dot-breathe inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                  Ready for {selectedModule.title}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Pipeline idle • last run 12m ago</p>
              </article>

              <article className="rounded-2xl border border-white/20 bg-white/10 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Quick Launch</p>
                <div className="mt-3 flex items-center gap-2">
                  <button type="button" onClick={() => setActiveModule("process")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-black/20 text-foreground transition hover:scale-[1.04]" aria-label="Open Video Processing">
                    <Rocket className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setActiveModule("qa")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-black/20 text-foreground transition hover:scale-[1.04]" aria-label="Open Q&A Assistant">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setActiveModule("history")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-black/20 text-foreground transition hover:scale-[1.04]" aria-label="Open History">
                    <History className="h-4 w-4" />
                  </button>
                </div>
              </article>

              <article className="rounded-2xl border border-white/20 bg-white/10 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Quick Search</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-[hsl(0_0%_92%)]">
                  <Rocket className="h-4 w-4 text-muted-foreground" />
                  Command search ready
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Tap the top bar to jump between modules</p>
              </article>
            </div>
          </aside>

          <div className="animate-fade-rise-delay grid h-full min-h-0 grid-rows-[auto_1fr] gap-5">
            <header className="liquid-glass module-hero-glow rounded-[28px] p-6 sm:p-7">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Active Module</p>
              <h1 className="mt-2 text-4xl leading-none text-foreground sm:text-5xl" style={{ fontFamily: "'Instrument Serif', serif" }}>
                {selectedModule.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[hsl(0_0%_90%)] sm:text-base">
                {selectedModule.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="liquid" className="rounded-full px-6 py-2.5 text-sm hover:scale-[1.03]">
                  Open {selectedModule.title}
                </Button>
                <Button asChild variant="liquid" className="rounded-full px-6 py-2.5 text-sm hover:scale-[1.03]">
                  <Link to="/signin">Connect Account</Link>
                </Button>
              </div>
            </header>

            <div className="min-h-0 overflow-y-auto pr-1">
              <article className="liquid-glass rounded-[28px] p-6 sm:p-7">
                <h3 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Get Started</h3>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-[hsl(0_0%_90%)] sm:text-lg">
                  {selectedModule.emptyState}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="liquid" className="rounded-full px-6 py-2.5 text-sm hover:scale-[1.03]">
                    Start {selectedModule.title}
                  </Button>
                  <Button variant="liquid" className="rounded-full px-6 py-2.5 text-sm hover:scale-[1.03]">
                    View Last Session
                  </Button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
