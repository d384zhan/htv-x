"use client"

import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Minimize2, Send, Maximize2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getPortfolio, PortfolioEntry } from '@/lib/supabase'

interface Plan {
  action: string
  crypto: string
  amount: number
  reason?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'bot'
  content: string
  isPlan?: boolean
  plans?: Plan[]
}

/**
 * Format text with citations - converts [Source: X] into styled spans
 */
const formatCitations = (text: string) => {
  const parts = text.split(/(\[Source: [^\]]+\])/)
  return parts.map((part, idx) => {
    if (part.match(/\[Source: [^\]]+\]/)) {
      return (
        <span 
          key={idx} 
          className="text-blue-300 text-xs font-medium bg-blue-950/30 px-1.5 py-0.5 rounded ml-1 border border-blue-800/40"
        >
          {part}
        </span>
      )
    }
    return <span key={idx}>{part}</span>
  })
}

/**
 * Draggable, minimizable AI chat window with Gemini API integration
 */
export const DraggableAIChat: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState(true)
  const [position, setPosition] = useState({ x: 20, y: 700 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [portfolio, setPortfolio] = useState<any[]>([])
  const chatRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch portfolio data on mount and keep it updated
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const data = await getPortfolio()
        const portfolioWithValues = data.map((entry: PortfolioEntry) => ({
          ticker: entry.crypto_ticker,
          quantity: entry.quantity,
          totalValue: entry.quantity
        }))
        setPortfolio(portfolioWithValues)
      } catch (error) {
        console.error('Failed to fetch portfolio:', error)
      }
    }
    
    fetchPortfolio()
    const interval = setInterval(fetchPortfolio, 30000)
    return () => clearInterval(interval)
  }, [])

  // Load messages from sessionStorage on mount
  useEffect(() => {
    const savedMessages = sessionStorage.getItem('dashboard-chat-messages')
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
      sessionStorage.setItem('dashboard-chat-messages', JSON.stringify(messages))
    }
  }, [messages])

  // Initialize position on client side - top right corner
  useEffect(() => {
    const getResponsivePadding = () => {
      const width = window.innerWidth
      if (width >= 1024) return 128
      if (width >= 768) return 96
      if (width >= 640) return 64
      return 32
    }
    const padding = getResponsivePadding()
    setPosition({ x: window.innerWidth - 200 - padding, y: 32 })
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (chatRef.current) {
      const rect = chatRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
      setIsDragging(true)
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      const maxX = window.innerWidth - (isMinimized ? 200 : 400)
      const maxY = window.innerHeight - (isMinimized ? 60 : 500)
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  const handleSend = async () => {
    if (!inputValue.trim()) return
    
    setLoading(true)
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue
    }
    setMessages(prev => [...prev, userMessage])
    
    const userInput = inputValue
    setInputValue('')

    try {
      const res = await fetch("https://htv-x.onrender.com/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: userInput,
          portfolio: portfolio  // Include portfolio data
        }),
      })
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: data.research || data.error || "No response received.",
        isPlan: data.is_plan || false,
        plans: data.plans || []
      }
      
      setMessages(prev => [...prev, botMessage])
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: `Error: ${err instanceof Error ? err.message : "Failed to fetch response."}`
      }
      setMessages(prev => [...prev, errorMessage])
    }
    
    setLoading(false)
  }

  return (
    <div
      ref={chatRef}
      className="fixed z-50 select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '200px' : '400px',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {isMinimized ? (
        /* Minimized State */
        <div className="bg-gradient-to-b from-[#2a2727] to-[#1f1d1d] rounded-full px-5 py-3 shadow-lg border border-[#3a3736] hover:from-[#323030] hover:to-[#252322] transition-all">
          <div className="flex items-center gap-3">
            <div
              onMouseDown={handleMouseDown}
              className="flex items-center gap-3 cursor-grab active:cursor-grabbing flex-1"
            >
              <MessageSquare className="w-5 h-5 text-white" />
              <span className="text-white font-karla font-medium text-sm">AI Assistant</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsMinimized(false)
              }}
              className="hover:scale-110 transition-transform cursor-pointer p-1 hover:bg-[#3a3736] rounded"
              title="Expand chat"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      ) : (
        /* Expanded State */
        <div className="bg-gradient-to-b from-[#2e2b2a] to-[#252322] rounded-2xl shadow-2xl border border-[#3a3736] overflow-hidden">
          {/* Header */}
          <div
            onMouseDown={handleMouseDown}
            className="bg-gradient-to-r from-[#3a3736] to-[#32302e] px-4 py-3 cursor-grab active:cursor-grabbing flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-white" />
              <span className="text-white font-karla font-semibold text-sm">AI Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMinimized(true)
                }}
                className="hover:bg-[#4a4542] rounded p-1 transition-colors"
              >
                <Minimize2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-[#3a3736] scrollbar-track-transparent" style={{ height: '480px' }}>
            {messages.length === 0 ? (
              <p className="text-gray-500 font-karla text-sm text-center py-8">
                Start a conversation with your AI assistant
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex flex-col max-w-[85%]">
                    <div
                      className={`rounded-2xl px-3 py-2 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-b from-[#e8e8e8] to-[#c9c9c9] text-[#2a2727]'
                          : 'bg-[#1a1817] text-white border border-[#3a3736]'
                      }`}
                    >
                      <p className="font-karla text-sm">{formatCitations(msg.content)}</p>
                    </div>
                    
                    {/* Plan buttons */}
                    {msg.isPlan && msg.plans && msg.plans.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {msg.plans.map((plan, idx) => (
                          <div key={idx} className="flex flex-col gap-2">
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
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1a1817] text-white border border-[#3a3736] rounded-2xl px-3 py-2">
                  <p className="font-karla text-sm">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t border-[#3a3736]">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 bg-[#1a1817] rounded-xl px-3 py-2 text-white placeholder:text-gray-500 font-karla text-sm border border-[#0f0e0d] focus:outline-none focus:border-[#2a2827] transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || !inputValue.trim()}
                className="bg-gradient-to-b from-[#e8e8e8] to-[#c9c9c9] hover:from-[#f0f0f0] hover:to-[#d9d9d9] rounded-xl px-3 py-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 text-[#2a2727]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}