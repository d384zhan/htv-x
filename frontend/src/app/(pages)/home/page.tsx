"use client"

import { ChevronUp, ArrowRight } from "lucide-react"
import { Carousel } from "@/components/carousel"
import { useMemo, useState } from "react"
import Link from "next/link"

type Plan = {
  action: string
  crypto: string
  amount: number
  reason?: string
}

type Message = {
  role: "user" | "bot"
  content: string
  isPlan?: boolean
  plans?: Plan[]
}

export default function HomePage() {
  const carouselCards = useMemo(() => [
    { ticker: "BTC", price: "$67,234", percentChange: 2.34 },
    { ticker: "ETH", price: "$3,456", percentChange: -1.23 },
    { ticker: "SOL", price: "$142", percentChange: 5.67 },
    { ticker: "ADA", price: "$0.58", percentChange: 3.45 },
    { ticker: "DOT", price: "$6.89", percentChange: -0.89 },
  ], [])

  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError(null)

    // Add user message
    setMessages(prev => [...prev, { role: "user", content: input }])
    const userInput = input
    setInput("")

    try {
      console.log("Sending request to backend...")
      const res = await fetch("http://localhost:4000/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userInput }),
      })
      
      console.log("Response status:", res.status)
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      console.log("Response data:", data)
      
      if (data.research) {
        setMessages(prev => [...prev, { 
          role: "bot", 
          content: data.research,
          isPlan: data.is_plan || false,
          plans: data.plans || []
        }])
      } else if (data.error) {
        setMessages(prev => [...prev, { role: "bot", content: data.error }])
      } else {
        setMessages(prev => [...prev, { role: "bot", content: "No response received." }])
      }
    } catch (err) {
      console.error("Fetch error:", err)
      setMessages(prev => [...prev, { role: "bot", content: `Error: ${err instanceof Error ? err.message : "Failed to fetch research."}` }])
    }
    setLoading(false)
  }

  // Allow pressing Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-[#181716] flex items-center justify-center py-12">
      <div className="w-full px-[168px] max-lg:px-12 max-md:px-6 flex flex-col gap-4">
        <h1 className="text-white text-6xl md:text-7xl lg:text-8xl font-bold text-center">placeholder title.</h1>
        <Carousel cards={carouselCards} />

        <div className="bg-gradient-to-b from-[#2e2b2a] to-[#252322] rounded-3xl p-8 min-h-[600px] flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.1)] border border-[#4a4542]">
          <div className="flex-1 overflow-y-auto mb-4 max-h-[350px]">
            {messages.length === 0 && (
              <div className="text-gray-400 text-center">Start chatting about cryptocurrencies!</div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-2 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex flex-col max-w-[80%]">
                  <div
                    className={`px-4 py-2 rounded-xl ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                  
                  {/* Show transaction buttons if it's a plan with multiple options */}
                  {msg.isPlan && msg.plans && msg.plans.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.plans.map((plan, planIdx) => (
                        <div key={planIdx} className="flex flex-col gap-1">
                          <Link 
                            href={`/transaction?action=${plan.action}&crypto=${plan.crypto}&amount=${plan.amount}`}
                            className="w-full"
                          >
                            <button className="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="font-semibold">
                                    {plan.action.charAt(0).toUpperCase() + plan.action.slice(1)} {plan.amount} {plan.crypto}
                                  </span>
                                  {plan.reason && (
                                    <span className="text-xs text-blue-200 mt-1">
                                      {plan.reason}
                                    </span>
                                  )}
                                </div>
                                <ArrowRight className="w-4 h-4 flex-shrink-0 ml-2" />
                              </div>
                            </button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="mb-2 flex justify-start">
                <div className="px-4 py-2 rounded-xl bg-gray-700 text-gray-100">Thinking...</div>
              </div>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full bg-[#1a1817] rounded-2xl px-6 py-6 pr-20 min-h-[80px] text-white placeholder:text-gray-500 font-karla text-lg shadow-[inset_0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_4px_rgba(0,0,0,0.3)] border border-[#0f0e0d] focus:outline-none focus:border-[#2a2827] transition-colors"
              disabled={loading}
            />
            <button
              className="absolute bottom-4 right-4 bg-gradient-to-b from-[#e8e8e8] to-[#c9c9c9] hover:from-[#f0f0f0] hover:to-[#d9d9d9] transition-all rounded-xl w-12 h-12 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.5)] border border-[#ffffff40] active:scale-95"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <ChevronUp className="w-5 h-5 text-[#181716]" />
            </button>
          </div>
        </div>

        <Link href="/dashboard" className="mx-auto">
          <button className="bg-gradient-to-b from-[#2a2727] to-[#1f1d1d] hover:from-[#323030] hover:to-[#252322] transition-all rounded-full px-8 py-4 flex items-center gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.4),0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] border border-[#3a3736] active:scale-95">
            <span className="text-white font-karla font-medium text-base">Go to Dashboard</span>
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        </Link>
      </div>
    </div>
  )
}