"use client"

import { ChevronUp } from "lucide-react"
import { Carousel } from "@/components/carousel"
import { useMemo } from "react"

export default function Page() {
  // Memoize cards array to prevent re-creating on every render
  // This ensures Carousel component doesn't re-render unnecessarily
  const carouselCards = useMemo(() => [
    { content: "Feature 1" },
    { content: "Feature 2" },
    { content: "Feature 3" },
    { content: "Feature 4" },
    { content: "Feature 5" },
  ], []) // Empty dependency array - cards never change

  return (
    <div className="min-h-screen bg-[#181716] flex items-center justify-center">
      <div className="w-full px-[168px] py-8 max-lg:px-12 max-md:px-6">
        {/* Title */}
        <h1 className="text-white text-6xl md:text-7xl lg:text-8xl font-bold text-center mb-8">placeholder title.</h1>

        {/* Carousel Component - Always shows exactly 5 cards */}
        <Carousel cards={carouselCards} />

        <div className="bg-gradient-to-b from-[#2e2b2a] to-[#252322] rounded-3xl p-8 min-h-[600px] flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.1)] border border-[#4a4542]">
          <div className="flex-1" />

          <div className="relative">
            <input
              type="text"
              placeholder="Type your message..."
              className="w-full bg-[#1a1817] rounded-2xl px-6 py-6 pr-20 min-h-[80px] text-white placeholder:text-gray-500 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_4px_rgba(0,0,0,0.3)] border border-[#0f0e0d] focus:outline-none focus:border-[#2a2827] transition-colors"
            />
            <button className="absolute bottom-4 right-4 bg-gradient-to-b from-[#e8e8e8] to-[#c9c9c9] hover:from-[#f0f0f0] hover:to-[#d9d9d9] transition-all rounded-xl w-12 h-12 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.5)] border border-[#ffffff40] active:scale-95">
              <ChevronUp className="w-5 h-5 text-[#181716]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
