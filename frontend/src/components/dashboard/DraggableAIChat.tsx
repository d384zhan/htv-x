"use client"

import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Minimize2, X, Send, Maximize2 } from 'lucide-react'
import { ChatMessage } from '@/types'

interface DraggableAIChatProps {
  onSendMessage?: (message: string) => void
  messages?: ChatMessage[]
}

/**
 * Draggable, minimizable AI chat window
 * Remembers position in localStorage
 */
export const DraggableAIChat: React.FC<DraggableAIChatProps> = ({
  onSendMessage,
  messages = []
}) => {
  const [isMinimized, setIsMinimized] = useState(true)
  const [position, setPosition] = useState({ x: 20, y: 700 }) // Default value, will be updated on client
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [inputValue, setInputValue] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize position on client side
  useEffect(() => {
    setPosition({ x: 20, y: window.innerHeight - 80 })
  }, [])

  // Load saved position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai-chat-state')
    if (saved) {
      try {
        const { isMinimized: savedMinimized, position: savedPosition } = JSON.parse(saved)
        setIsMinimized(savedMinimized ?? true)
        if (savedPosition) {
          setPosition(savedPosition)
        }
      } catch (e) {
        console.error('Failed to load chat state:', e)
      }
    }
  }, [])

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem('ai-chat-state', JSON.stringify({ isMinimized, position }))
  }, [isMinimized, position])

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
      
      // Keep within viewport bounds
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

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue)
      setInputValue('')
    }
  }

  return (
    <div
      ref={chatRef}
      className="fixed z-50 select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '200px' : '380px',
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
          <div className="h-[300px] overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-[#3a3736] scrollbar-track-transparent">
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
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-b from-[#e8e8e8] to-[#c9c9c9] text-[#2a2727]'
                        : 'bg-[#1a1817] text-white border border-[#3a3736]'
                    }`}
                  >
                    <p className="font-karla text-sm">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#3a3736]">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 bg-[#1a1817] rounded-xl px-4 py-2 text-white placeholder:text-gray-500 font-karla text-sm border border-[#0f0e0d] focus:outline-none focus:border-[#2a2827] transition-colors"
              />
              <button
                onClick={handleSend}
                className="bg-gradient-to-b from-[#e8e8e8] to-[#c9c9c9] hover:from-[#f0f0f0] hover:to-[#d9d9d9] rounded-xl px-3 py-2 transition-all active:scale-95"
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
