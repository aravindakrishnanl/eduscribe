import { useEffect, useState } from "react"

type CursorState = {
  x: number
  y: number
  visible: boolean
  hovering: boolean
}

const INTERACTIVE_SELECTOR =
  "a, button, [role='button'], input, textarea, select, label"

export default function CustomCursor() {
  const [cursor, setCursor] = useState<CursorState>({
    x: 0,
    y: 0,
    visible: false,
    hovering: false,
  })

  useEffect(() => {
    const supportsFinePointer = window.matchMedia("(pointer: fine)").matches
    if (!supportsFinePointer) {
      return
    }

    document.body.classList.add("custom-cursor-enabled")

    const handleMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const isHoveringInteractive = !!target?.closest(INTERACTIVE_SELECTOR)

      setCursor({
        x: event.clientX,
        y: event.clientY,
        visible: true,
        hovering: isHoveringInteractive,
      })
    }

    const handleLeave = () => {
      setCursor((prev) => ({ ...prev, visible: false, hovering: false }))
    }

    window.addEventListener("mousemove", handleMove)
    document.addEventListener("mouseleave", handleLeave)

    return () => {
      window.removeEventListener("mousemove", handleMove)
      document.removeEventListener("mouseleave", handleLeave)
      document.body.classList.remove("custom-cursor-enabled")
    }
  }, [])

  return (
    <>
      <div
        aria-hidden="true"
        className={`custom-cursor-ring ${cursor.visible ? "is-visible" : ""} ${cursor.hovering ? "is-hovering" : ""}`}
        style={{ left: cursor.x, top: cursor.y }}
      />
      <div
        aria-hidden="true"
        className={`custom-cursor-dot ${cursor.visible ? "is-visible" : ""} ${cursor.hovering ? "is-hovering" : ""}`}
        style={{ left: cursor.x, top: cursor.y }}
      />
    </>
  )
}
