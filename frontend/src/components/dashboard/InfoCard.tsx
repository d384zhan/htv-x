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
export const InfoCard: React.FC<InfoCardProps> = ({
  label,
  value,
  percentChange,
  showTrend = false
}) => {
  const isPositive = percentChange !== undefined && percentChange >= 0

  return (
    <div className="bg-gradient-to-b from-[#2a2827]/95 to-[#1f1d1d]/95 rounded-2xl w-full h-32 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.4),0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] border-2 border-transparent bg-clip-padding relative overflow-hidden">
      {/* Metallic border gradient */}
      <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#8a8785] via-[#5a5654] to-[#3a3736] -z-10"></div>
      
      {/* Glossy highlight overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10 rounded-2xl pointer-events-none" />
      
      <div className="relative z-10 px-8 w-full">
        <p className="text-gray-300 font-karla font-semibold text-lg mb-3">
          {label}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-white font-karla font-bold text-3xl">
            {value}
          </span>
          
          {showTrend && percentChange !== undefined && (
            <div className={`flex items-center gap-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? (
                <TrendingUp className="w-7 h-7" />
              ) : (
                <TrendingDown className="w-7 h-7" />
              )}
              <span className="font-karla font-bold text-2xl">
                {Math.abs(percentChange).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
