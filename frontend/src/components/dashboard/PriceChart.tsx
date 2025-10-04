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

  return (
    <div className="bg-gradient-to-b from-[#2e2b2a] to-[#252322] rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-[#3a3736] h-full flex flex-col">
      {/* Header */}
      <h3 className="text-white font-karla font-bold text-lg mb-4 flex-shrink-0">
        {ticker} Price - Last 3 Months
      </h3>

      {/* Chart - flex-1 ensures it takes remaining space */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
