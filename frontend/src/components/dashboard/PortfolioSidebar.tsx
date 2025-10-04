"use client"

import React from 'react'
import { PortfolioHolding } from '@/types'
import { PortfolioCoinCard } from './PortfolioCoinCard'

interface PortfolioSidebarProps {
  holdings: PortfolioHolding[]
  totalValue: number
  selectedCoinId: string | null
  onCoinSelect: (coinId: string) => void
}

/**
 * Left sidebar showing portfolio summary and coin list
 */
export const PortfolioSidebar: React.FC<PortfolioSidebarProps> = ({
  holdings,
  totalValue,
  selectedCoinId,
  onCoinSelect
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-8">
        {/* Title - fixed height for alignment */}
        <div className="h-[58px] flex items-center mb-6">
          <h2 className="text-white font-karla font-bold text-4xl leading-none">Portfolio</h2>
        </div>
        
        {/* Total Value Card */}
        <div className="bg-gradient-to-b from-[#e8e8e8] to-[#c9c9c9] rounded-2xl p-6 shadow-lg border border-[#ffffff40] relative overflow-hidden">
          {/* Glossy overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10 pointer-events-none" />
          
          <div className="relative">
            <p className="text-[#2a2727] font-karla font-semibold text-lg mb-2">Total Value</p>
            <p className="text-[#2a2727] font-karla font-bold text-4xl">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Holdings List - Scrollable */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#3a3736] scrollbar-track-transparent">
        <div className="space-y-[16px]">
          {holdings.length > 0 ? (
            holdings.map((holding) => (
              <PortfolioCoinCard
                key={holding.coinId}
                holding={holding}
                isSelected={selectedCoinId === holding.coinId}
                onClick={() => onCoinSelect(holding.coinId)}
              />
            ))
          ) : (
            <div className="text-gray-500 font-karla text-center py-8 text-base">
              No holdings yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
