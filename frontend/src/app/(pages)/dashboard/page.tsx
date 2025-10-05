"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useMemo, useEffect } from "react"
import { PortfolioSidebar } from "@/components/dashboard/PortfolioSidebar"
import { CoinDetailView } from "@/components/dashboard/CoinDetailView"
import { DraggableAIChat } from "@/components/dashboard/DraggableAIChat"
import { PortfolioHolding, CoinDetails } from "@/types"
import { getPortfolio, getTotalValue, PortfolioEntry } from "@/lib/supabase"

/**
 * Extended coin database with prices and names
 * Add more coins here as needed
 */
const COIN_DATABASE: Record<string, { name: string; price: number }> = {
  'BTC': { name: 'Bitcoin', price: 67234 },
  'ETH': { name: 'Ethereum', price: 3456 },
  'SOL': { name: 'Solana', price: 142 },
  'ADA': { name: 'Cardano', price: 0.62 },
  'DOT': { name: 'Polkadot', price: 7.89 },
  'MATIC': { name: 'Polygon', price: 0.89 },
  'AVAX': { name: 'Avalanche', price: 38.5 },
  'LINK': { name: 'Chainlink', price: 14.2 },
  'UNI': { name: 'Uniswap', price: 6.5 },
  'ATOM': { name: 'Cosmos', price: 9.8 },
}

/**
 * Get coin information by ticker
 * If coin not in database, creates a default entry
 */
const getCoinInfo = (ticker: string) => {
  const upperTicker = ticker.toUpperCase()
  if (COIN_DATABASE[upperTicker]) {
    return COIN_DATABASE[upperTicker]
  }
  // Default values for unknown coins
  return {
    name: ticker,
    price: 1.0 // Default price for unknown coins
  }
}

/**
 * Generate realistic price history for any coin
 * Creates 90 days of historical price data
 */
const generatePriceHistory = (basePrice: number, ticker: string) => {
  const data = []
  const now = Date.now()
  const threeMonthsAgo = now - (90 * 24 * 60 * 60 * 1000)
  
  // Use ticker as seed for consistent random data
  const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  for (let i = 0; i < 90; i++) {
    const timestamp = threeMonthsAgo + (i * 24 * 60 * 60 * 1000)
    // Create pseudo-random variance based on ticker and day
    const pseudoRandom = Math.sin(seed + i) * 0.5 + 0.5
    const variance = (pseudoRandom - 0.5) * basePrice * 0.15
    
    data.push({
      timestamp,
      date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: basePrice + variance
    })
  }
  return data
}

/**
 * Dynamically create coin details for any ticker
 * This ensures every coin in your portfolio gets proper data
 */
const createCoinDetails = (ticker: string): CoinDetails => {
  const coinInfo = getCoinInfo(ticker)
  const upperTicker = ticker.toUpperCase()
  
  return {
    id: ticker.toLowerCase(),
    ticker: upperTicker,
    name: coinInfo.name,
    currentPrice: coinInfo.price,
    priceChange24h: (Math.random() - 0.5) * 10, // Random % change
    marketCap: coinInfo.price * 1000000000, // Estimated market cap
    volume24h: coinInfo.price * 50000000, // Estimated volume
    circulatingSupply: 1000000000, // Estimated supply
    maxSupply: upperTicker === 'BTC' ? 21000000 : undefined,
    priceHistory: generatePriceHistory(coinInfo.price, ticker)
  }
}

export default function DashboardPage() {
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null)
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([])
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // New state for live coin data
  const [selectedCoinDetails, setSelectedCoinDetails] = useState<CoinDetails | null>(null)
  const [isFetchingCoinData, setIsFetchingCoinData] = useState(false)

  /**
   * Load portfolio data from Supabase when component mounts
   * This runs once when the page loads
   */
  useEffect(() => {
    loadPortfolio()
  }, [])

  /**
   * Fetch live coin data from backend when a coin is selected
   */
  useEffect(() => {
    if (selectedCoinId && selectedCoinId !== 'cash') {
      fetchCoinData(selectedCoinId)
    } else {
      setSelectedCoinDetails(null)
    }
  }, [selectedCoinId])

  /**
   * Fetch current price and historical data for a coin from the backend
   */
  const fetchCoinData = async (coinId: string) => {
    setIsFetchingCoinData(true)
    
    try {
      const ticker = coinId.toUpperCase()
      
      // Fetch 90 days of historical price data
      const response = await fetch(
        `https://htv-x.onrender.com/api/historical-prices/${ticker}-USD?granularity=ONE_DAY&days_back=90`
      )

      if (!response.ok) {
        console.error(`Failed to fetch coin data for ${ticker}`)
        // Fall back to mock data if API fails
        setSelectedCoinDetails(createCoinDetails(ticker))
        return
      }

      const data = await response.json()

      if (data.success && data.data?.candles && data.data.candles.length > 0) {
        const candles = data.data.candles
        
        // Get current price (most recent candle)
        const currentPrice = parseFloat(candles[0].close)
        
        // Calculate 24h price change
        const yesterdayPrice = candles.length > 1 ? parseFloat(candles[1].close) : currentPrice
        const priceChange24h = ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100
        
        // Transform candles into price history format
        const priceHistory = candles.map((candle: any) => ({
          timestamp: parseInt(candle.start) * 1000, // Convert to milliseconds
          date: new Date(parseInt(candle.start) * 1000).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          price: parseFloat(candle.close)
        })).reverse() // Reverse to show oldest to newest
        
        // Get coin info
        const coinInfo = getCoinInfo(ticker)
        
        // Create coin details with live data
        const coinDetails: CoinDetails = {
          id: coinId,
          ticker: ticker,
          name: coinInfo.name,
          currentPrice: currentPrice,
          priceChange24h: priceChange24h,
          marketCap: currentPrice * 1000000000, // Estimated
          volume24h: candles[0].volume ? parseFloat(candles[0].volume) : currentPrice * 50000000,
          circulatingSupply: 1000000000, // Estimated
          maxSupply: ticker === 'BTC' ? 21000000 : undefined,
          priceHistory: priceHistory
        }
        
        setSelectedCoinDetails(coinDetails)
      } else {
        // Fall back to mock data if response is invalid
        setSelectedCoinDetails(createCoinDetails(ticker))
      }
    } catch (error) {
      console.error('Error fetching coin data:', error)
      // Fall back to mock data on error
      setSelectedCoinDetails(createCoinDetails(coinId.toUpperCase()))
    } finally {
      setIsFetchingCoinData(false)
    }
  }

  /**
   * Fetch portfolio from database and transform it into the format our UI expects
   * Includes CASH in the list but it will be non-clickable
   */
  const loadPortfolio = async () => {
    try {
      setLoading(true)
      
      // Get all crypto holdings from Supabase
      const portfolioData = await getPortfolio()
      
      // Transform database data into the format our UI components expect
      // Include CASH but it will be handled specially in the UI
      const transformedHoldings: PortfolioHolding[] = portfolioData
        .filter((item: PortfolioEntry) => item.quantity > 0) // Only show non-zero balances
        .map((item: PortfolioEntry) => {
          const ticker = item.crypto_ticker
          const isCash = ticker === 'CASH'
          const coinInfo = isCash ? { name: 'US Dollar', price: 1 } : getCoinInfo(ticker)
          const quantity = item.quantity
          
          return {
            coinId: ticker.toLowerCase(),
            ticker: ticker,
            name: coinInfo.name,
            quantity: quantity,
            totalValue: quantity * coinInfo.price,
            averageBuyPrice: coinInfo.price, // In a real app, you'd track this separately
          }
        })
        .sort((a, b) => {
          // Sort CASH to the top, then alphabetically by ticker
          if (a.ticker === 'CASH') return -1
          if (b.ticker === 'CASH') return 1
          return a.ticker.localeCompare(b.ticker)
        })
      
      setHoldings(transformedHoldings)
      
      // Also load total value (includes CASH)
      const total = await getTotalValue()
      setTotalPortfolioValue(total)
    } catch (error) {
      console.error('Error loading portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  // Find the currently selected holding
  const selectedHolding = holdings.find(h => h.coinId === selectedCoinId) || null

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen bg-[#181716] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#3a5a7a] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-karla text-lg">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#181716] overflow-hidden flex flex-col" style={{ maxHeight: '100vh' }}>
      <div className="w-full px-8 sm:px-16 md:px-24 lg:px-32 py-8 flex-shrink-0" style={{ maxWidth: '1920px', marginLeft: 'auto', marginRight: 'auto' }}>
        {/* Back Button */}
        <Link href="/home" className="inline-block mb-8">
          <button className="bg-gradient-to-b from-[#2a2727] to-[#1f1d1d] hover:from-[#323030] hover:to-[#252322] transition-all rounded-full px-6 py-3 flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.4),0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] border border-[#3a3736] active:scale-95">
            <ArrowLeft className="w-4 h-4 text-white" />
            <span className="text-white font-karla font-medium text-sm">Back</span>
          </button>
        </Link>
      </div>

      {/* Main Dashboard Container */}
      <div className="flex-1 px-8 sm:px-16 md:px-24 lg:px-32 pb-16 min-h-0 w-full" style={{ maxWidth: '1920px', marginLeft: 'auto', marginRight: 'auto' }}>
        <div className="bg-gradient-to-b from-[#2e2b2a] to-[#252322] rounded-3xl h-full shadow-[0_8px_32px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.1)] border border-[#4a4542] overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row gap-8 lg:gap-8 p-8">
            {/* Left Sidebar - Portfolio */}
            <div className="w-full lg:w-1/4 lg:min-w-[280px] flex-shrink-0">
              <PortfolioSidebar
                holdings={holdings}
                totalValue={totalPortfolioValue}
                selectedCoinId={selectedCoinId}
                onCoinSelect={setSelectedCoinId}
              />
            </div>

            {/* Vertical Separator Line - Hidden on mobile */}
            <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-[#4a4542] to-transparent flex-shrink-0"></div>

            {/* Right Content - Coin Details */}
            <div className="flex-1 min-h-0">
              {isFetchingCoinData ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#3a5a7a] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-karla">Loading coin data...</p>
                  </div>
                </div>
              ) : (
                <CoinDetailView
                  coinDetails={selectedCoinDetails}
                  holding={selectedHolding}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Draggable AI Chat */}
      <DraggableAIChat />
    </div>
  )
}