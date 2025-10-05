import React from 'react'
import Image from 'next/image'
import { PortfolioHolding } from '@/types'

interface PortfolioCoinCardProps {
  holding: PortfolioHolding
  isSelected: boolean
  onClick: () => void
}

/**
 * Individual coin card in the portfolio sidebar
 * Shows ticker and has hover/selected states
 * CASH is shown but non-clickable with quantity displayed
 */
export const PortfolioCoinCard: React.FC<PortfolioCoinCardProps> = ({
  holding,
  isSelected,
  onClick
}) => {
  const isCash = holding.ticker === 'CASH'
  
  // Calculate profit/loss
  const costBasis = holding.quantity * holding.averageBuyPrice
  const profitLoss = holding.totalValue - costBasis
  const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0
  const hasProfit = profitLoss > 0
  const hasLoss = profitLoss < 0
  
  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl p-3 mx-1
        transition-all duration-200
        ${isCash 
          ? 'bg-gradient-to-b from-[#2e2b2a] to-[#252322] border border-[#3a3736] opacity-90 cursor-default' 
          : isSelected 
            ? 'bg-gradient-to-b from-[#3d3a38] to-[#32302e] border-2 border-[#5a5654] shadow-lg scale-[1.02] cursor-pointer' 
            : 'bg-gradient-to-b from-[#2e2b2a] to-[#252322] border border-[#3a3736] hover:border-[#4a4542] cursor-pointer'
        }
        ${!isCash && 'hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]'}
      `}
    >
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/5 pointer-events-none rounded-2xl" />
      
      <div className="relative flex items-center gap-3">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-full ${isCash ? 'bg-gradient-to-b from-[#90c090] to-[#70a070]' : 'bg-gradient-to-b from-[#e8e8e8] to-[#c9c9c9]'} flex items-center justify-center shadow-md flex-shrink-0`}>
          {isCash ? (
            <span className="text-[#1a1817] font-karla font-bold text-sm">$</span>
          ) : holding.iconUrl ? (
            <Image 
              src={holding.iconUrl} 
              alt={holding.ticker}
              width={20}
              height={20}
            />
          ) : (
            <span className="text-[#2a2727] font-karla font-bold text-xs">
              {holding.ticker.slice(0, 2)}
            </span>
          )}
        </div>
        
        {/* Ticker and Name/Quantity */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-white font-karla font-bold text-base">
            {holding.ticker}
          </span>
          {isCash ? (
            <span className="text-gray-300 font-karla text-sm">
              ${holding.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          ) : (
            <>
              <span className="text-gray-400 font-karla text-xs truncate">
                {holding.name}
              </span>
              {/* Profit/Loss indicator */}
              {(hasProfit || hasLoss) && (
                <span className={`font-karla text-xs font-medium ${hasProfit ? 'text-green-400' : 'text-red-400'}`}>
                  {hasProfit ? '+' : ''}{profitLossPercent.toFixed(2)}%
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
