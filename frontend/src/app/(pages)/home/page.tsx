"use client"

import { Send, ArrowRight } from "lucide-react"
import { Carousel } from "@/components/carousel"
import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { getPortfolio, PortfolioEntry } from "@/lib/supabase"

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

type CarouselCard = {
  ticker: string
  price: string
  percentChange: number
}

export default function HomePage() {
  // State for carousel cards - will be updated with live prices
  const [carouselCards, setCarouselCards] = useState<CarouselCard[]>([
    { ticker: "BTC", price: "$67,234", percentChange: 2.34 },
    { ticker: "ETH", price: "$3,456", percentChange: -1.23 },
    { ticker: "SOL", price: "$142", percentChange: 5.67 },
    { ticker: "ADA", price: "$0.58", percentChange: 3.45 },
    { ticker: "DOT", price: "$6.89", percentChange: -0.89 },
  ])

  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [portfolio, setPortfolio] = useState<any[]>([])

  // Fetch portfolio data on mount and keep it updated
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const data = await getPortfolio()
        // Transform portfolio data to include calculated values
        const portfolioWithValues = data.map((entry: PortfolioEntry) => ({
          ticker: entry.crypto_ticker,
          quantity: entry.quantity,
          totalValue: entry.quantity // Will be multiplied by price on backend if needed
        }))
        setPortfolio(portfolioWithValues)
      } catch (error) {
        console.error('Failed to fetch portfolio:', error)
      }
    }
    
    fetchPortfolio()
    // Refresh portfolio every 30 seconds to keep it in sync
    const interval = setInterval(fetchPortfolio, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch live prices from backend every 5 seconds
  useEffect(() => {
    const tickers = ["BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "DOT-USD"]
    
    const fetchPrices = async () => {
      try {
        const pricePromises = tickers.map(async (ticker) => {
          const response = await fetch(
            `https://htv-x.onrender.com/api/historical-prices/${ticker}?granularity=ONE_DAY&days_back=2`
          )
          const data = await response.json()
          
          if (data.success && data.data?.candles && data.data.candles.length >= 2) {
            const candles = data.data.candles
            // Most recent candle is first (index 0), previous is index 1
            const currentPrice = parseFloat(candles[0].close)
            const previousPrice = parseFloat(candles[1].close)
            const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100
            
            return {
              ticker: ticker.split('-')[0], // Get just "BTC" from "BTC-USD"
              price: `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              percentChange: percentChange
            }
          }
          
          // Return null if fetch fails
          return null
        })
        
        const results = await Promise.all(pricePromises)
        const validResults = results.filter((r): r is CarouselCard => r !== null)
        
        if (validResults.length > 0) {
          setCarouselCards(validResults)
        }
      } catch (error) {
        console.error('Failed to fetch prices:', error)
      }
    }
    
    // Fetch immediately on mount
    fetchPrices()
    
    // Set up interval to fetch every 5 seconds
    const intervalId = setInterval(fetchPrices, 5000)
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId)
  }, [])

  // Load messages from sessionStorage on mount
  useEffect(() => {
    const savedMessages = sessionStorage.getItem('home-chat-messages')
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages))
      } catch (e) {
        console.error('Failed to parse saved messages:', e)
      }
    }
  }, [])

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('home-chat-messages', JSON.stringify(messages))
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError(null)

    // Add user message
    setMessages(prev => [...prev, { role: "user", content: input }])
    const userInput = input
    setInput("")

    try {
      // https://htv-x.onrender.com/api/gemini
      console.log("Sending request to backend with portfolio...")
      const res = await fetch("https://htv-x.onrender.com/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: userInput,
          portfolio: portfolio  // Include portfolio data
        }),
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
    <div className="h-screen bg-[#181716] flex items-center justify-center overflow-hidden" style={{ maxHeight: '100vh' }}>
      <div className="w-full h-full px-8 sm:px-16 md:px-24 lg:px-32 flex flex-col gap-6 py-12" style={{ maxWidth: '1920px', marginLeft: 'auto', marginRight: 'auto' }}>
        {/* Title */}
        <h1 className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center italic flex-shrink-0">Coinpilot.</h1>

        {/* Carousel Component - Displays crypto prices */}
        <div className="flex-shrink-0">
          <Carousel cards={carouselCards} />
        </div>

        <div className="bg-gradient-to-b from-[#2e2b2a] to-[#252322] rounded-3xl flex-1 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.1)] border border-[#4a4542] min-h-0 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 min-h-0 scrollbar-thin scrollbar-thumb-[#3a3736] scrollbar-track-transparent">
            {messages.length === 0 && (
              <div className="text-gray-400 text-center text-sm">Start chatting with assistant about cryptocurrencies!</div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex flex-col max-w-[80%]">
                  <div
                    className={`px-3 py-2 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-gradient-to-b from-[#e8e8e8] to-[#c9c9c9] text-[#2a2727] shadow-lg"
                        : "bg-[#1a1817] text-white border border-[#3a3736]"
                    }`}
                  >
                    <span className="font-karla text-sm">{msg.content}</span>
                  </div>
                  
                  {/* Show transaction buttons if it's a plan with multiple options */}
                  {msg.isPlan && msg.plans && msg.plans.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {msg.plans.map((plan, planIdx) => (
                        <div key={planIdx} className="flex flex-col gap-2">
                          <Link 
                            href={`/transaction?action=${plan.action}&crypto=${plan.crypto}&amount=${plan.amount}`}
                            className="w-full"
                          >
                            <button className="w-full bg-gradient-to-b from-[#3a5a7a] to-[#2a4a6a] hover:from-[#4a6a8a] hover:to-[#3a5a7a] text-white px-3 py-2 rounded-xl text-sm font-medium font-karla transition-all active:scale-95 shadow-lg text-left">
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
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl bg-[#1a1817] text-white border border-[#3a3736] font-karla text-sm">Thinking...</div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-2 border-t border-[#3a3736] flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 bg-[#1a1817] rounded-xl px-3 py-2 text-white placeholder:text-gray-500 font-karla text-sm border border-[#0f0e0d] focus:outline-none focus:border-[#2a2827] transition-colors"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-b from-[#e8e8e8] to-[#c9c9c9] hover:from-[#f0f0f0] hover:to-[#d9d9d9] rounded-xl px-3 py-2 transition-all active:scale-95 disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="w-4 h-4 text-[#2a2727]" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 text-center">
          <Link href="/dashboard">
            <button className="bg-gradient-to-b from-[#2a2727] to-[#1f1d1d] hover:from-[#323030] hover:to-[#252322] transition-all rounded-full px-6 py-2.5 flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.4),0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] border border-[#3a3736] active:scale-95 mx-auto">
              <span className="text-white font-karla font-medium text-sm">Go to Dashboard</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}