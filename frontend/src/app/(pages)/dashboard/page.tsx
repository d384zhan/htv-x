"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useMemo } from "react"
import { PortfolioSidebar } from "@/components/dashboard/PortfolioSidebar"
import { CoinDetailView } from "@/components/dashboard/CoinDetailView"
import { DraggableAIChat } from "@/components/dashboard/DraggableAIChat"
import { PortfolioHolding, CoinDetails, ChatMessage } from "@/types"

// Mock data - will be replaced with API calls
const generateMockPriceHistory = (basePrice: number) => {
  const data = []
  const now = Date.now()
  const threeMonthsAgo = now - (90 * 24 * 60 * 60 * 1000)
  
  for (let i = 0; i < 90; i++) {
    const timestamp = threeMonthsAgo + (i * 24 * 60 * 60 * 1000)
    const variance = (Math.random() - 0.5) * basePrice * 0.1
    data.push({
      timestamp,
      date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: basePrice + variance
    })
  }
  return data
}

const mockHoldings: PortfolioHolding[] = [
  { 
    coinId: 'btc', 
    ticker: 'BTC', 
    name: 'Bitcoin', 
    quantity: 0.5, 
    totalValue: 33617, 
    averageBuyPrice: 65000 
  },
  { 
    coinId: 'eth', 
    ticker: 'ETH', 
    name: 'Ethereum', 
    quantity: 2.5, 
    totalValue: 8640, 
    averageBuyPrice: 3200 
  },
  { 
    coinId: 'sol', 
    ticker: 'SOL', 
    name: 'Solana', 
    quantity: 50, 
    totalValue: 7100, 
    averageBuyPrice: 135 
  },
]

const mockCoinDetails: Record<string, CoinDetails> = {
  'btc': {
    id: 'btc',
    ticker: 'BTC',
    name: 'Bitcoin',
    currentPrice: 67234,
    priceChange24h: 2.34,
    marketCap: 1300000000000,
    volume24h: 35000000000,
    circulatingSupply: 19500000,
    maxSupply: 21000000,
    priceHistory: generateMockPriceHistory(67234)
  },
  'eth': {
    id: 'eth',
    ticker: 'ETH',
    name: 'Ethereum',
    currentPrice: 3456,
    priceChange24h: -1.23,
    marketCap: 415000000000,
    volume24h: 18000000000,
    circulatingSupply: 120000000,
    priceHistory: generateMockPriceHistory(3456)
  },
  'sol': {
    id: 'sol',
    ticker: 'SOL',
    name: 'Solana',
    currentPrice: 142,
    priceChange24h: 5.67,
    marketCap: 65000000000,
    volume24h: 2500000000,
    circulatingSupply: 450000000,
    priceHistory: generateMockPriceHistory(142)
  },
}

export default function DashboardPage() {
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI trading assistant. How can I help you today?',
      timestamp: Date.now()
    }
  ])

  const totalValue = useMemo(() => 
    mockHoldings.reduce((sum, h) => sum + h.totalValue, 0),
    []
  )

  const selectedHolding = mockHoldings.find(h => h.coinId === selectedCoinId) || null
  const selectedCoinDetails = selectedCoinId ? mockCoinDetails[selectedCoinId] : null

  const handleSendMessage = (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    }
    
    // Simulate AI response
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'This is a simulated response. Connect to your AI backend for real responses.',
      timestamp: Date.now() + 1000
    }

    setChatMessages(prev => [...prev, userMessage, aiMessage])
  }

  return (
    <div className="h-screen bg-[#181716] overflow-hidden flex flex-col">
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-24 py-4 sm:py-6 flex-shrink-0">
        {/* Back Button */}
        <Link href="/home" className="inline-block mb-4 sm:mb-6">
          <button className="bg-gradient-to-b from-[#2a2727] to-[#1f1d1d] hover:from-[#323030] hover:to-[#252322] transition-all rounded-full px-6 py-3 flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.4),0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] border border-[#3a3736] active:scale-95">
            <ArrowLeft className="w-4 h-4 text-white" />
            <span className="text-white font-karla font-medium text-sm">Back</span>
          </button>
        </Link>
      </div>

      {/* Main Dashboard Container */}
      <div className="flex-1 px-4 sm:px-8 md:px-12 lg:px-24 pb-4 sm:pb-6 min-h-0">
        <div className="bg-gradient-to-b from-[#2e2b2a] to-[#252322] rounded-3xl h-full shadow-[0_8px_32px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.1)] border border-[#4a4542] overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
            {/* Left Sidebar - Portfolio */}
            <div className="w-full lg:w-1/4 lg:min-w-[280px] flex-shrink-0">
              <PortfolioSidebar
                holdings={mockHoldings}
                totalValue={totalValue}
                selectedCoinId={selectedCoinId}
                onCoinSelect={setSelectedCoinId}
              />
            </div>

            {/* Vertical Separator Line - Hidden on mobile */}
            <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-[#4a4542] to-transparent flex-shrink-0"></div>

            {/* Right Content - Coin Details */}
            <div className="flex-1 min-h-0">
              <CoinDetailView
                coinDetails={selectedCoinDetails}
                holding={selectedHolding}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Draggable AI Chat */}
      <DraggableAIChat 
        messages={chatMessages}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}
