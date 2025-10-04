"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#181716] flex items-center justify-center py-12">
      <div className="w-full px-[168px] max-lg:px-12 max-md:px-6">
        {/* Back Button */}
        <Link href="/home" className="inline-block mb-8">
          <button className="bg-gradient-to-b from-[#2a2727] to-[#1f1d1d] hover:from-[#323030] hover:to-[#252322] transition-all rounded-full px-6 py-3 flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.4),0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] border border-[#3a3736] active:scale-95">
            <ArrowLeft className="w-4 h-4 text-white" />
            <span className="text-white font-karla font-medium text-sm">Back</span>
          </button>
        </Link>

        {/* Dashboard Title */}
        <h1 className="text-white text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-12">Dashboard</h1>

        {/* Dashboard Content Container */}
        <div className="bg-gradient-to-b from-[#2e2b2a] to-[#252322] rounded-3xl p-8 min-h-[600px] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.1)] border border-[#4a4542]">
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 font-karla text-lg">Dashboard content goes here...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
