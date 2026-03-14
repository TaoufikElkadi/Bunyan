"use client"

import { useRef, useState, useEffect } from "react"
import { DashboardMockup } from "./dashboard-mockup"

export function MobileHeroMockup() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return
      // Inner padding: 2.5 * 4 = 10px each side = 20px total
      const availableWidth = containerRef.current.offsetWidth - 20
      // Render mockup at 900px wide, scale to fit
      setScale(availableWidth / 900)
    }
    updateScale()
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [])

  // The rendered mockup height at 900px wide is ~620px (min-h on the component)
  const mockupHeight = 620
  const scaledHeight = mockupHeight * scale

  return (
    <div ref={containerRef} className="relative rounded-2xl overflow-hidden bg-[#edeae4] p-2.5 pt-3">
      <div className="relative w-full overflow-hidden rounded-xl" style={{ height: scaledHeight || "auto" }}>
        <div
          className="absolute top-0 left-0 bg-white rounded-xl overflow-hidden shadow-[0_2px_24px_rgba(38,27,7,0.06)]"
          style={{
            width: 900,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <DashboardMockup />
        </div>
      </div>
    </div>
  )
}
