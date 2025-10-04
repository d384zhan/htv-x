import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface InfoCardProps {
  label: string
  value: string
  percentChange?: number
  showTrend?: boolean
}

/**
 * Info card displaying a stat (amount owned, selling price, 24h change)
 * Similar styling to carousel cards
 */
export default function InfoCard({ label, value, percentChange, showTrend }: InfoCardProps) {
  return (
    <div className="bg-[#2a2727] rounded-2xl p-4 shadow-lg border border-[#ffffff1a] flex flex-col justify-between">
      <p className="text-gray-400 font-karla text-sm mb-1">{label}</p>
      {showTrend ? (
        <div className="flex items-center gap-2">
          {percentChange && percentChange >= 0 ? (
            <>
              <TrendingUp className="w-5 h-5 text-green-500" />
              <p className="text-green-500 font-karla font-semibold text-xl">
                +{percentChange.toFixed(2)}%
              </p>
            </>
          ) : (
            <>
              <TrendingDown className="w-5 h-5 text-red-500" />
              <p className="text-red-500 font-karla font-semibold text-xl">
                {percentChange?.toFixed(2)}%
              </p>
            </>
          )}
        </div>
      ) : (
        <p className="text-white font-karla font-semibold text-xl">{value}</p>
      )}
    </div>
  )
}