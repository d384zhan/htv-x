"use client"

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PriceDataPoint } from '@/types'

interface PriceChartProps {
  data: PriceDataPoint[]
  ticker: string
}

/**
 * Price chart showing historical data for a coin
 * Uses recharts for visualization
 */
export const PriceChart: React.FC<PriceChartProps> = ({ data, ticker }) => {
  // Determine if overall trend is positive
  const isPositiveTrend = data.length > 1 && data[data.length - 1].price > data[0].price

  // Calculate 90-day stats
  const prices = data.map(d => d.price)
  const high90d = Math.max(...prices)
  const low90d = Math.min(...prices)
  const startPrice = data.length > 0 ? data[0].price : 0
  const endPrice = data.length > 0 ? data[data.length - 1].price : 0
  const priceChange = endPrice - startPrice
  const percentChange = startPrice > 0 ? ((priceChange / startPrice) * 100) : 0

  // Calculate tighter Y-axis domain for better fluctuation visibility
  const priceRange = high90d - low90d
  const padding = priceRange * 0.05 // 5% padding on each side
  const yMin = Math.max(0, low90d - padding)
  const yMax = high90d + padding

  return (
    <div className="bg-gradient-to-b from-[#2e2b2a] to-[#252322] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-[#3a3736] h-full flex flex-col">
      {/* Header */}
      <h3 className="text-white font-karla font-bold text-lg mb-2 flex-shrink-0">
        {ticker} Price - Last 3 Months
      </h3>

      {/* 90-Day Summary Stats - Single Line */}
      <div className="text-gray-400 font-karla text-xs mb-4 flex-shrink-0">
        90d High: <span className="text-white font-semibold ml-1">${high90d.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span className="mx-3">•</span>
        90d Low: <span className="text-white font-semibold ml-1">${low90d.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span className="mx-3">•</span>
        90d Change: <span className={`font-semibold ml-1 ${percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
        </span>
      </div>

      {/* Chart - flex-1 ensures it takes remaining space */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3736" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              style={{ fontSize: '12px', fontFamily: 'var(--font-karla)' }}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: '12px', fontFamily: 'var(--font-karla)' }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              domain={[yMin, yMax]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f1d1d',
                border: '1px solid #3a3736',
                borderRadius: '8px',
                fontFamily: 'var(--font-karla)'
              }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: isPositiveTrend ? '#15803d' : '#b91c1c' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={isPositiveTrend ? '#22c55e' : '#ef4444'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
