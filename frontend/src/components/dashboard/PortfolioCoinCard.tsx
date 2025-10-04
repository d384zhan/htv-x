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
 */
export const PortfolioCoinCard: React.FC<PortfolioCoinCardProps> = ({
  holding,
  isSelected,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl p-3 cursor-pointer mx-1
        transition-all duration-200
        ${isSelected 
          ? 'bg-gradient-to-b from-[#3d3a38] to-[#32302e] border-2 border-[#5a5654] shadow-lg scale-[1.02]' 
          : 'bg-gradient-to-b from-[#2e2b2a] to-[#252322] border border-[#3a3736] hover:border-[#4a4542]'
        }
        hover:scale-[1.02] hover:shadow-xl
        active:scale-[0.98]
      `}
    >
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/5 pointer-events-none rounded-2xl" />
      
      <div className="relative flex items-center gap-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#e8e8e8] to-[#c9c9c9] flex items-center justify-center shadow-md flex-shrink-0">
          {holding.iconUrl ? (
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
        
        {/* Ticker and Name */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-white font-karla font-bold text-base">
            {holding.ticker}
          </span>
          <span className="text-gray-400 font-karla text-xs truncate">
            {holding.name}
          </span>
        </div>
      </div>
    </div>
  )
}
