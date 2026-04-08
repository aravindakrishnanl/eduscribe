import { useEffect, useRef, useState } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { VIDEO_URL } from "@/lib/constants"

export default function LandingPage() {
  const mainRef = useRef<HTMLElement | null>(null)
  const [activeSection, setActiveSection] = useState("top")
  const sectionIds = ["top", "how-it-works", "support", "contact"] as const

  const handleSectionJump = (id: string) => (event: ReactMouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()

    const section = document.getElementById(id)
    const container = mainRef.current
    if (!section || !container) return

    const targetTop = Math.max(0, section.offsetTop - 110)
    container.scrollTo({ top: targetTop, behavior: "smooth" })
    setActiveSection(id)
    window.history.replaceState(null, "", `#${id}`)
  }

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]")
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px",
      },
    )

    nodes.forEach((node) => observer.observe(node))

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const container = mainRef.current
    if (!container) return

    const updateActiveSection = () => {
      const nearBottom =
        container.scrollTop + container.clientHeight >= container.scrollHeight - 6

      if (nearBottom) {
        setActiveSection("contact")
        window.history.replaceState(null, "", "#contact")
        return
      }

      const offset = container.scrollTop + container.clientHeight * 0.38
      let currentSection = sectionIds[0]

      sectionIds.forEach((id) => {
        const section = document.getElementById(id)
        if (section && offset >= section.offsetTop) {
          currentSection = id
        }
      })

      setActiveSection(currentSection)
      window.history.replaceState(null, "", `#${currentSection}`)
    }

    updateActiveSection()
    container.addEventListener("scroll", updateActiveSection, { passive: true })
    window.addEventListener("resize", updateActiveSection)

    return () => {
      container.removeEventListener("scroll", updateActiveSection)
      window.removeEventListener("resize", updateActiveSection)
    }
  }, [])

  return (
    <main ref={mainRef} className="relative h-screen overflow-y-auto overflow-x-hidden bg-background text-foreground [-ms-overflow-style:none] [scrollbar-width:none]">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 z-0 h-screen w-screen object-cover"
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_15%_20%,rgba(120,195,255,0.14),transparent_42%),radial-gradient(circle_at_82%_72%,rgba(150,255,228,0.1),transparent_44%),linear-gradient(180deg,rgba(4,14,26,0.52)_0%,rgba(4,14,26,0.42)_55%,rgba(4,14,26,0.55)_100%)]" />

      <div className="pointer-events-none fixed -left-24 top-24 z-[2] h-64 w-64 rounded-full bg-[rgba(116,208,255,0.2)] blur-3xl animate-float-slow" />
      <div className="pointer-events-none fixed right-[-70px] top-[38%] z-[2] h-56 w-56 rounded-full bg-[rgba(132,255,211,0.17)] blur-3xl animate-float-medium" />
      <div className="pointer-events-none fixed bottom-12 left-[46%] z-[2] h-44 w-44 rounded-full bg-[rgba(255,255,255,0.1)] blur-3xl animate-float-fast" />

      <div className="sticky top-0 z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-6 backdrop-blur-[2px]">
        <div
          className="text-3xl tracking-tight text-foreground"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Eduscribe.
        </div>

        <nav className="nav-ribbon hidden items-center gap-2 md:flex">
          <a
            className={`nav-ribbon-link ${activeSection === "top" ? "is-active" : ""}`}
            href="#top"
            onClick={handleSectionJump("top")}
          >
            Home
          </a>
          <a
            className={`nav-ribbon-link ${activeSection === "how-it-works" ? "is-active" : ""}`}
            href="#how-it-works"
            onClick={handleSectionJump("how-it-works")}
          >
            How It Works
          </a>
          <a
            className={`nav-ribbon-link ${activeSection === "support" ? "is-active" : ""}`}
            href="#support"
            onClick={handleSectionJump("support")}
          >
            Support
          </a>
          <a
            className={`nav-ribbon-link ${activeSection === "contact" ? "is-active" : ""}`}
            href="#contact"
            onClick={handleSectionJump("contact")}
          >
            Contact
          </a>
        </nav>

        <Button
          asChild
          className="rounded-full px-6 py-2.5 text-sm hover:scale-[1.03]"
          variant="liquid"
        >
          <Link to="/signin">Sign In</Link>
        </Button>
      </div>

      <section id="top" className="relative z-10 mx-auto w-full max-w-7xl scroll-mt-28 px-6 pb-10 pt-14 sm:pt-20">
        <div className="mx-auto max-w-6xl text-center">
          <h1
            className="animate-fade-rise text-5xl font-normal leading-[0.95] tracking-[-2.2px] sm:text-7xl md:text-8xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Transform <em className="not-italic text-muted-foreground">videos</em> into{" "}
            <em className="not-italic text-muted-foreground">insights.</em>
          </h1>

          <p
            className="animate-fade-rise-delay mx-auto mt-7 max-w-4xl text-base font-medium leading-relaxed text-[hsl(0_0%_92%)] sm:text-lg"
            style={{ textShadow: "0 2px 14px rgba(0, 0, 0, 0.45)" }}
          >
            Eduscribe helps you learn from long YouTube lectures faster by extracting
            transcript context, generating clear summaries, and creating voice-ready
            revision output.
          </p>

          <div className="animate-fade-rise-delay-2 mt-10 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              variant="liquid"
              className="min-w-[240px] cursor-pointer rounded-full px-16 py-5 text-lg font-medium tracking-[0.02em] hover:scale-[1.04] sm:text-xl"
            >
              <Link to="/signin">Start Free</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 mx-auto w-full max-w-7xl scroll-mt-28 px-6 pb-10 pt-8">
        <div data-reveal className="reveal-on-scroll liquid-glass rounded-[32px] p-7 sm:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">How It Works</p>
          <h2
            className="mt-3 text-4xl leading-[0.95] text-foreground sm:text-5xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            From long videos to quick learning loops.
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-[hsl(0_0%_90%)] sm:text-lg">
            Eduscribe turns educational videos into study-ready output. You paste a YouTube
            link, we process transcript and context, then generate summaries and voice-ready
            notes so your revision gets faster every day.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article data-reveal className="reveal-on-scroll rounded-2xl border border-white/20 bg-white/10 p-5 [transition-delay:80ms]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">01</p>
              <h3 className="mt-2 text-lg text-foreground" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Paste Video
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[hsl(0_0%_88%)]">
                Add a YouTube URL and start your analysis session in seconds.
              </p>
            </article>

            <article data-reveal className="reveal-on-scroll rounded-2xl border border-white/20 bg-white/10 p-5 [transition-delay:160ms]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">02</p>
              <h3 className="mt-2 text-lg text-foreground" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Generate Insights
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[hsl(0_0%_88%)]">
                Extract transcript signals and AI summaries for quick understanding.
              </p>
            </article>

            <article data-reveal className="reveal-on-scroll rounded-2xl border border-white/20 bg-white/10 p-5 [transition-delay:240ms]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">03</p>
              <h3 className="mt-2 text-lg text-foreground" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Listen & Review
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[hsl(0_0%_88%)]">
                Turn summaries into voice narration and revise while multitasking.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="support" className="relative z-10 mx-auto w-full max-w-7xl scroll-mt-28 px-6 pb-10 pt-4">
        <div data-reveal className="reveal-on-scroll liquid-glass rounded-[32px] p-7 sm:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Support</p>
          <h2
            className="mt-3 text-4xl leading-[0.95] text-foreground sm:text-5xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Stuck on a lecture? We can help.
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-[hsl(0_0%_90%)] sm:text-lg">
            Use Eduscribe support to resolve transcript gaps, summary quality issues,
            and workflow questions quickly so your study sessions keep moving.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article data-reveal className="reveal-on-scroll rounded-2xl border border-white/20 bg-white/10 p-5 [transition-delay:80ms]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">FAQ</p>
              <h3 className="mt-2 text-lg text-foreground" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Quick Answers
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[hsl(0_0%_88%)]">
                Before you email us, check here - we probably already answered it at 2am.
              </p>
            </article>

            <article data-reveal className="reveal-on-scroll rounded-2xl border border-white/20 bg-white/10 p-5 [transition-delay:160ms]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Bug Report</p>
              <h3 className="mt-2 text-lg text-foreground" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Something Broke?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[hsl(0_0%_88%)]">
                Spotted a glitch? Tell us. We fix faster than your Wi-Fi reconnects in an exam hall.
              </p>
            </article>

            <article data-reveal className="reveal-on-scroll rounded-2xl border border-white/20 bg-white/10 p-5 [transition-delay:240ms]">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Community / Discord</p>
              <h3 className="mt-2 text-lg text-foreground" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Student Community
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[hsl(0_0%_88%)]">
                Join other students using Eduscribe - share tips, note templates, and the occasional panic before exams.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="contact" className="relative z-10 mx-auto w-full max-w-7xl scroll-mt-28 px-6 pb-10 pt-4">
        <div data-reveal className="reveal-on-scroll liquid-glass rounded-[32px] p-7 sm:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contact Us</p>
          <h2
            className="mt-3 text-4xl leading-[0.95] text-foreground sm:text-5xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Build with us. Learn with us.
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-[hsl(0_0%_90%)] sm:text-lg">
            Drop us a message. We promise to reply faster than your professor.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild variant="liquid" className="rounded-full px-8 py-3 text-sm hover:scale-[1.03]">
              <a href="mailto:hello@eduscribe.app">hello@eduscribe.app</a>
            </Button>
            <Button asChild variant="liquid" className="rounded-full px-8 py-3 text-sm hover:scale-[1.03]">
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                Instagram
              </a>
            </Button>
            <Button asChild variant="liquid" className="rounded-full px-8 py-3 text-sm hover:scale-[1.03]">
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </Button>
            <Button asChild variant="liquid" className="rounded-full px-8 py-3 text-sm hover:scale-[1.03]">
              <a href="https://x.com" target="_blank" rel="noreferrer">
                X / Twitter
              </a>
            </Button>
            <Button asChild variant="liquid" className="rounded-full px-8 py-3 text-sm hover:scale-[1.03]">
              <a href="https://discord.com" target="_blank" rel="noreferrer">
                Discord
              </a>
            </Button>
            <Button asChild variant="liquid" className="rounded-full px-8 py-3 text-sm hover:scale-[1.03]">
              <a href="https://www.youtube.com" target="_blank" rel="noreferrer">
                YouTube
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
