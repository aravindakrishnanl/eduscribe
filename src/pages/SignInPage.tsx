import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { VIDEO_URL } from "@/lib/constants"

const GOOGLE_AUTH_URL = import.meta.env.VITE_GOOGLE_AUTH_URL ?? "/api/auth/google"

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-5.9s2.7-5.9 5.9-5.9c1.8 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.4 14.7 2.5 12 2.5a9.5 9.5 0 1 0 0 19c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.2-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M3.4 7.5l3.2 2.4c.8-2.2 2.9-3.8 5.4-3.8 1.8 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.4 14.7 2.5 12 2.5c-3.7 0-6.9 2.1-8.6 5z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.5c2.7 0 4.9-.9 6.5-2.5l-3-2.5c-.8.6-2 1.2-3.5 1.2-2.4 0-4.5-1.6-5.3-3.9l-3.2 2.4a9.5 9.5 0 0 0 8.5 5.3z"
      />
      <path
        fill="#4285F4"
        d="M21.2 12.1c0-.6-.1-1.2-.2-1.9H12v3.9h5.4c-.3 1.4-1.1 2.5-2 3.2l3 2.5c1.8-1.7 2.8-4.2 2.8-7.7z"
      />
    </svg>
  )
}

export default function SignInPage() {
  const navigate = useNavigate()

  function handleGoogleSignIn() {
    window.location.href = GOOGLE_AUTH_URL
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate("/dashboard")
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 z-0 h-full w-full object-cover"
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-6">
        <Link
          className="text-3xl tracking-tight text-foreground"
          style={{ fontFamily: "'Instrument Serif', serif" }}
          to="/"
        >
          Eduscribe.
        </Link>

        <Button asChild className="rounded-full px-6 py-2.5 text-sm hover:scale-[1.03]" variant="liquid">
          <Link to="/">Back Home</Link>
        </Button>
      </div>

      <section className="relative z-10 mx-auto grid h-[calc(100vh-96px)] w-full max-w-7xl grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-2">
        <div className="animate-fade-rise text-left">
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
            Welcome back
          </p>
          <h1
            className="mt-4 max-w-xl text-5xl leading-[0.95] tracking-[-2px] sm:text-6xl md:text-7xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Your study cockpit for <em className="not-italic text-muted-foreground">every video.</em>
          </h1>
          <p
            className="mt-6 max-w-xl text-base font-medium leading-relaxed text-[hsl(0_0%_92%)] sm:text-lg"
            style={{ textShadow: "0 2px 14px rgba(0, 0, 0, 0.45)" }}
          >
            Sign in to convert YouTube lessons into concise summaries, timestamped notes,
            and voice-ready revisions built for focused learning.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <span className="liquid-glass animate-float-slow rounded-full px-5 py-2 text-xs uppercase tracking-[0.14em] text-foreground">
              Smart Summaries
            </span>
            <span className="liquid-glass animate-float-medium rounded-full px-5 py-2 text-xs uppercase tracking-[0.14em] text-foreground">
              Voice Playback
            </span>
            <span className="liquid-glass animate-float-fast rounded-full px-5 py-2 text-xs uppercase tracking-[0.14em] text-foreground">
              Transcript Search
            </span>
          </div>
        </div>

        <div className="animate-fade-rise-delay liquid-glass relative overflow-hidden rounded-[32px] p-8 sm:p-10">
          <div className="pointer-events-none absolute -left-12 top-[-120px] h-40 w-40 rotate-12 bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute inset-y-0 -left-24 w-16 animate-scanline bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative z-10">
            <h2
              className="text-3xl text-foreground sm:text-4xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Sign In
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Continue to your Eduscribe workspace.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm text-muted-foreground">
                Email
                <input
                  type="email"
                  placeholder="you@college.edu"
                  className="mt-2 h-12 w-full rounded-2xl border border-white/20 bg-black/20 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-white/40"
                />
              </label>

              <label className="block text-sm text-muted-foreground">
                Password
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="mt-2 h-12 w-full rounded-2xl border border-white/20 bg-black/20 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-white/40"
                />
              </label>

              <Button
                type="submit"
                variant="liquid"
                className="animate-fade-rise-delay-2 mt-3 h-12 w-full rounded-2xl text-base hover:scale-[1.02]"
              >
                Continue
              </Button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-white/20" />
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Or
                </span>
                <div className="h-px flex-1 bg-white/20" />
              </div>

              <Button
                type="button"
                variant="liquid"
                onClick={handleGoogleSignIn}
                className="h-12 w-full rounded-2xl text-base hover:scale-[1.02]"
              >
                <span className="mr-2 inline-flex items-center">
                  <GoogleIcon />
                </span>
                Continue with Google
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Sign in securely to continue to your workspace.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
