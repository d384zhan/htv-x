import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface CarouselCardProps {
  content?: string
  ticker?: string
  price?: string
  percentChange?: number
  className?: string
}

/**
 * Individual card component for the carousel
 * Displays crypto coin information with ticker, price, and percent change
 * Implements a sleek, glossy metallic design with drop shadows
 * Optimized as PureComponent to prevent unnecessary re-renders
 */
export class CarouselCard extends React.PureComponent<CarouselCardProps> {
  render() {
    const { content, ticker, price, percentChange, className = '' } = this.props
    
    // Display crypto data if provided, otherwise fallback to simple content
    const isCryptoMode = ticker && price !== undefined && percentChange !== undefined
    const isPositive = percentChange !== undefined && percentChange >= 0

    return (
      <div
        className={`
          bg-gradient-to-b from-[#e8e8e8] to-[#c9c9c9]
          rounded-2xl w-[227px] h-20 flex-shrink-0
          flex items-center justify-center
          shadow-[0_4px_12px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.5)]
          border border-[#ffffff40]
          relative
          overflow-hidden
          will-change-transform
          ${className}
        `}
      >
        {/* Glossy highlight overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10 rounded-2xl pointer-events-none" />
        
        {/* Content */}
        {isCryptoMode ? (
          <div className="relative z-10 px-6 flex items-center justify-between w-full">
            {/* Ticker */}
            <span className="text-[#2a2727] font-karla font-bold text-3xl">
              {ticker}
            </span>
            
            {/* Price and Percent Change - Stacked */}
            <div className="flex flex-col items-end gap-0.5">
              {/* Price */}
              <span className="text-[#2a2727] font-karla font-semibold text-xl">
                {price}
              </span>
              
              {/* Percent Change with Arrow */}
              <div className={`flex items-center gap-1.5 ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                {isPositive ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <span className="font-karla font-semibold text-lg">
                  {Math.abs(percentChange).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ) : content ? (
          <span className="relative z-10 text-[#2a2727] font-karla font-medium text-lg px-6">
            {content}
          </span>
        ) : null}
      </div>
    )
  }
}
