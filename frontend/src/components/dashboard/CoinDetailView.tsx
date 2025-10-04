"use client"

import React from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { CoinDetails, PortfolioHolding } from '@/types'
import { InfoCard } from './InfoCard'
import { PriceChart } from './PriceChart'

interface CoinDetailViewProps {
  coinDetails: CoinDetails | null
  holding: PortfolioHolding | null
}

/**
 * Right panel showing detailed information about selected coin
 */
export const CoinDetailView: React.FC<CoinDetailViewProps> = ({
  coinDetails,
  holding
}) => {
  if (!coinDetails || !holding) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-gray-400 font-karla text-2xl mb-2">
            No coin selected
          </p>
          <p className="text-gray-500 font-karla text-lg">
            Select a coin from your portfolio to view details
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header section - perfectly aligns with Portfolio section */}
      <div className="mb-8">
        {/* Title row - same height as Portfolio title */}
        <div className="h-[58px] flex items-center justify-between mb-6">
          <div className="flex items-baseline gap-3">
            <h2 className="text-white font-karla font-bold text-4xl leading-none">
              {coinDetails.ticker}
            </h2>
            <p className="text-gray-400 font-karla text-xl leading-none">
              {coinDetails.name}
            </p>
          </div>
          
          <Link href="/transaction">
            <button className="bg-gradient-to-b from-[#e8e8e8] to-[#c9c9c9] hover:from-[#f0f0f0] hover:to-[#d9d9d9] transition-all rounded-full px-5 py-2.5 flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.5)] border border-[#ffffff40] active:scale-95">
              <Plus className="w-4 h-4 text-[#2a2727]" />
              <span className="text-[#2a2727] font-karla font-semibold text-sm">
                New Transaction
              </span>
            </button>
          </Link>
        </div>

        {/* Info Cards Row - Perfectly aligned with Total Value card */}
        <div className="grid grid-cols-3 gap-6">
          <InfoCard
            label="Amount Owned"
            value={`$${holding.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
          <InfoCard
            label="Current Price"
            value={`$${coinDetails.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
          <InfoCard
            label="24h Change"
            value=""
            percentChange={coinDetails.priceChange24h}
            showTrend={true}
          />
        </div>
      </div>

      {/* Price Chart */}
      <div className="flex-1 min-h-0">
        <PriceChart 
          data={coinDetails.priceHistory}
          ticker={coinDetails.ticker}
        />
      </div>
    </div>
  )
}
