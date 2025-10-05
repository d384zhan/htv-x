"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { TransactionAnalysis } from "@/types"
import { executeTransaction } from "@/lib/supabase"

function TransactionPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [coinInput, setCoinInput] = useState<string>('')
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy')
  const [quantity, setQuantity] = useState<string>('')
  const [analysis, setAnalysis] = useState<TransactionAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // New state for live price fetching
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [isPriceFetching, setIsPriceFetching] = useState(false)
  const [priceError, setPriceError] = useState<string | null>(null)

  // Populate form from URL parameters
  useEffect(() => {
    const action = searchParams.get('action')
    const crypto = searchParams.get('crypto')
    const amount = searchParams.get('amount')

    if (action && (action === 'buy' || action === 'sell')) {
      setTransactionType(action)
    }
    if (crypto) {
      setCoinInput(crypto)
    }
    if (amount) {
      setQuantity(amount)
    }
  }, [searchParams])

  /**
   * Fetch current price from backend for the coin ticker
   * Gets the latest price from the historical prices endpoint
   */
  const fetchCurrentPrice = async (ticker: string) => {
    if (!ticker || ticker.trim().length === 0) {
      setCurrentPrice(0)
      setPriceError(null)
      return
    }

    setIsPriceFetching(true)
    setPriceError(null)

    try {
      // Check if ticker already has -USD suffix, if not add it
      const tickerUpper = ticker.toUpperCase()
      const formattedTicker = tickerUpper.endsWith('-USD') ? tickerUpper : `${tickerUpper}-USD`
      
      // Fetch latest price data (1 day to get current price)
      const response = await fetch(
        `https://htv-x.onrender.com/api/historical-prices/${formattedTicker}?granularity=ONE_DAY&days_back=1`
      )

      if (response.status === 400) {
        // Invalid ticker
        const data = await response.json()
        setPriceError(`Invalid coin ticker: ${ticker.toUpperCase()}`)
        setCurrentPrice(0)
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch price: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data?.candles && data.data.candles.length > 0) {
        // Get the most recent closing price
        const latestPrice = parseFloat(data.data.candles[0].close)
        setCurrentPrice(latestPrice)
        setPriceError(null)
      } else {
        setPriceError('Unable to fetch price data')
        setCurrentPrice(0)
      }
    } catch (error) {
      console.error('Error fetching price:', error)
      setPriceError('Failed to fetch price')
      setCurrentPrice(0)
    } finally {
      setIsPriceFetching(false)
    }
  }

  // Fetch price whenever coinInput changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (coinInput && coinInput.trim().length > 0) {
        fetchCurrentPrice(coinInput.trim())
      } else {
        setCurrentPrice(0)
        setPriceError(null)
      }
    }, 500) // Debounce for 500ms

    return () => clearTimeout(delayDebounceFn)
  }, [coinInput])
  const totalValue = quantity && currentPrice ? parseFloat(quantity) * currentPrice : 0

  const handleAnalyze = async () => {
    if (!quantity || parseFloat(quantity) <= 0 || !coinInput.trim()) return

    setIsAnalyzing(true)
    
    try {
      console.log("Sending request:", {
        crypto: coinInput.toUpperCase(),
        action: transactionType,
        amount: parseFloat(quantity)
      })

      const res = await fetch("https://htv-x.onrender.com/api/gemini-coin-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          crypto: coinInput.toUpperCase(),
          action: transactionType,
          amount: parseFloat(quantity)
        }),
      })

      console.log("Response status:", res.status)

      if (!res.ok) {
        const errorText = await res.text()
        console.error("Error response:", errorText)
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      console.log("Full API response:", data)
      
      if (data.success && data.analysis) {
        const apiAnalysis = data.analysis
        console.log("API Analysis:", apiAnalysis)
        
        // Map the API response to our component's expected format
        const mappedAnalysis: TransactionAnalysis = {
          recommendation: apiAnalysis.recommendation.decision.toUpperCase().replace('STRONG_', '').replace('_', '') as 'BUY' | 'SELL' | 'HOLD' | 'CAUTION',
          confidence: apiAnalysis.recommendation.confidence,
          summary: apiAnalysis.summary,
          pros: apiAnalysis.pros,
          cons: apiAnalysis.cons,
          marketContext: `${apiAnalysis.market_context.current_trend} trend with ${apiAnalysis.market_context.volatility} volatility. ${apiAnalysis.market_context.market_sentiment}`,
          riskLevel: apiAnalysis.recommendation.risk_level.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH'
        }
        
        console.log("Mapped analysis:", mappedAnalysis)
        setAnalysis(mappedAnalysis)
      } else {
        console.error("Invalid response structure:", data)
        throw new Error("Invalid response structure")
      }
    } catch (err) {
      console.error("Failed to analyze coin:", err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      alert(`Failed to fetch analysis: ${errorMessage}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  /**
   * Execute the transaction and update the database
   * Works for any coin ticker - will create new entry if needed
   */
  const handleExecuteTransaction = async () => {
    if (!quantity || parseFloat(quantity) <= 0 || !coinInput.trim()) {
      alert('Please fill in all fields')
      return
    }

    setIsExecuting(true)

    try {
      // Call our Supabase function to update the portfolio
      // This will create a new entry if the coin doesn't exist
      await executeTransaction(
        coinInput.toUpperCase(),  // Ticker in uppercase
        parseFloat(quantity),      // Amount to buy/sell
        transactionType            // 'buy' or 'sell'
      )

      // Show success modal instead of alert
      setSuccessMessage(`Successfully ${transactionType === 'buy' ? 'purchased' : 'sold'} ${quantity} ${coinInput.toUpperCase()}!`)
      setShowSuccessModal(true)
      
    } catch (error) {
      console.error('Transaction error:', error)
      // Show error modal instead of alert
      setErrorMessage(error instanceof Error ? error.message : 'Failed to execute transaction')
      setShowErrorModal(true)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleBuyMore = () => {
    setShowSuccessModal(false)
    setCoinInput('')
    setQuantity('')
    setAnalysis(null)
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  // Reset analysis when form changes
  useEffect(() => {
    setAnalysis(null)
  }, [coinInput, transactionType, quantity])

  return (
    <div className="h-screen bg-[#181716] overflow-hidden flex flex-col" style={{ maxHeight: '100vh' }}>
      <div className="w-full px-8 sm:px-16 md:px-24 lg:px-32 py-6 flex-shrink-0" style={{ maxWidth: '1920px', marginLeft: 'auto', marginRight: 'auto' }}>
        {/* Back Button */}
        <Link href="/dashboard" className="inline-block mb-6">
          <button className="bg-gradient-to-b from-[#2a2727] to-[#1f1d1d] hover:from-[#323030] hover:to-[#252322] transition-all rounded-full px-6 py-3 flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.4),0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] border border-[#3a3736] active:scale-95">
            <ArrowLeft className="w-4 h-4 text-white" />
            <span className="text-white font-karla font-medium text-sm">Back to Dashboard</span>
          </button>
        </Link>

        {/* Page Title */}
        <h1 className="text-white text-3xl font-bold text-center mb-6 font-karla">New Transaction</h1>
      </div>

      <div className="flex-1 overflow-hidden px-8 sm:px-16 md:px-24 lg:px-32 pb-16 w-full" style={{ maxWidth: '1920px', marginLeft: 'auto', marginRight: 'auto' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full" style={{ maxWidth: '1536px', marginLeft: 'auto', marginRight: 'auto' }}>
          {/* Transaction Form */}
          <div className="bg-gradient-to-b from-[#2e2b2a] to-[#252322] rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.1)] border border-[#4a4542] flex flex-col">
            <h2 className="text-white text-xl font-bold mb-6 font-karla">Transaction Details</h2>

            {/* Coin Input */}
            <div className="mb-6">
              <label className="text-gray-400 text-sm font-karla mb-2 block">Coin Ticker</label>
              <input
                type="text"
                value={coinInput}
                onChange={(e) => setCoinInput(e.target.value.toUpperCase())}
                placeholder="e.g., BTC, ETH, SOL"
                className="w-full bg-gradient-to-b from-[#1f1d1d] to-[#181716] text-white font-karla text-base px-4 py-3 rounded-2xl border border-[#3a3736] shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] focus:outline-none focus:border-[#4a4542] transition-colors placeholder:text-gray-600"
              />
              {/* Show error message for invalid ticker */}
              {priceError && (
                <p className="text-red-400 text-xs font-karla mt-2 flex items-center gap-1">
                  <span>⚠️</span> {priceError}
                </p>
              )}
              {/* Show loading indicator */}
              {isPriceFetching && (
                <p className="text-gray-500 text-xs font-karla mt-2">
                  Fetching price...
                </p>
              )}
            </div>

            {/* Buy/Sell Toggle */}
            <div className="mb-6">
              <label className="text-gray-400 text-sm font-karla mb-2 block">Transaction Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTransactionType('buy')}
                  className={`flex-1 py-3 rounded-2xl font-karla font-medium transition-all ${
                    transactionType === 'buy'
                      ? 'bg-gradient-to-b from-[#2a5a2a] to-[#1f4a1f] text-white shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] border border-[#3a6a3a]'
                      : 'bg-gradient-to-b from-[#2a2727] to-[#1f1d1d] text-gray-400 border border-[#3a3736]'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setTransactionType('sell')}
                  className={`flex-1 py-3 rounded-2xl font-karla font-medium transition-all ${
                    transactionType === 'sell'
                      ? 'bg-gradient-to-b from-[#5a2a2a] to-[#4a1f1f] text-white shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] border border-[#6a3a3a]'
                      : 'bg-gradient-to-b from-[#2a2727] to-[#1f1d1d] text-gray-400 border border-[#3a3736]'
                  }`}
                >
                  Sell
                </button>
              </div>
            </div>

            {/* Quantity Input */}
            <div className="mb-6">
              <label className="text-gray-400 text-sm font-karla mb-2 block">Quantity</label>
              <input
                type="number"
                step="0.00000001"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gradient-to-b from-[#1f1d1d] to-[#181716] text-white font-karla text-base px-4 py-3 rounded-2xl border border-[#3a3736] shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] focus:outline-none focus:border-[#4a4542] transition-colors placeholder:text-gray-600"
              />
            </div>

            {/* Price Info */}
            <div className="mb-6 p-4 bg-gradient-to-b from-[#1f1d1d] to-[#181716] rounded-2xl border border-[#3a3736]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm font-karla">Price per {coinInput || 'coin'}</span>
                <span className={`font-karla font-medium ${currentPrice > 0 ? 'text-white' : 'text-gray-500'}`}>
                  {isPriceFetching ? (
                    'Loading...'
                  ) : currentPrice > 0 ? (
                    `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  ) : (
                    'N/A'
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-karla">Total Value</span>
                <span className={`font-karla font-bold text-base ${totalValue > 0 ? 'text-white' : 'text-gray-500'}`}>
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!quantity || parseFloat(quantity) <= 0 || !coinInput.trim() || isAnalyzing || isPriceFetching || priceError !== null}
              className="w-full bg-gradient-to-b from-[#3a5a7a] to-[#2a4a6a] hover:from-[#4a6a8a] hover:to-[#3a5a7a] disabled:from-[#2a2727] disabled:to-[#1f1d1d] text-white font-karla font-bold py-3 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] border border-[#4a6a8a] disabled:border-[#3a3736] disabled:text-gray-600 transition-all active:scale-95 disabled:active:scale-100">
              {isAnalyzing ? 'Analyzing...' : 'Get AI Analysis'}
            </button>
          </div>

          {/* AI Analysis - (rest of the code stays the same) */}
          <div className="bg-gradient-to-b from-[#2e2b2a] to-[#252322] rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.1)] border border-[#4a4542] overflow-hidden flex flex-col">
            <h2 className="text-white text-xl font-bold mb-6 font-karla flex-shrink-0">AI Analysis</h2>

            {!analysis && !isAnalyzing && (
              <div className="flex-1 flex items-center justify-center text-gray-500 font-karla text-center">
                Fill out the transaction details and click "Get AI Analysis" to receive insights
              </div>
            )}

            {isAnalyzing && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-[#3a5a7a] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 font-karla">Analyzing transaction...</p>
              </div>
            )}

            {analysis && (
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {/* Recommendation Badge */}
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-karla text-sm">Recommendation:</span>
                  <span className={`px-4 py-1 rounded-full font-karla font-medium text-sm ${
                    analysis.recommendation === 'BUY' 
                      ? 'bg-gradient-to-b from-[#2a5a2a] to-[#1f4a1f] text-green-400 border border-[#3a6a3a]'
                      : analysis.recommendation === 'SELL'
                      ? 'bg-gradient-to-b from-[#5a2a2a] to-[#4a1f1f] text-red-400 border border-[#6a3a3a]'
                      : analysis.recommendation === 'CAUTION'
                      ? 'bg-gradient-to-b from-[#5a5a2a] to-[#4a4a1f] text-yellow-400 border border-[#6a6a3a]'
                      : 'bg-gradient-to-b from-[#2a2727] to-[#1f1d1d] text-gray-400 border border-[#3a3736]'
                  }`}>
                    {analysis.recommendation}
                  </span>
                </div>

                {/* Risk Level */}
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-karla text-sm">Risk Level:</span>
                  <span className={`px-4 py-1 rounded-full font-karla font-medium text-sm ${
                    analysis.riskLevel === 'LOW'
                      ? 'bg-gradient-to-b from-[#2a5a2a] to-[#1f4a1f] text-green-400 border border-[#3a6a3a]'
                      : analysis.riskLevel === 'HIGH'
                      ? 'bg-gradient-to-b from-[#5a2a2a] to-[#4a1f1f] text-red-400 border border-[#6a3a3a]'
                      : 'bg-gradient-to-b from-[#5a5a2a] to-[#4a4a1f] text-yellow-400 border border-[#6a6a3a]'
                  }`}>
                    {analysis.riskLevel}
                  </span>
                </div>

                {/* Summary */}
                <div>
                  <h3 className="text-white font-karla font-medium mb-3">Summary</h3>
                  <p className="text-gray-300 font-karla text-sm leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                {/* Market Context */}
                <div>
                  <h3 className="text-white font-karla font-medium mb-3">Market Context</h3>
                  <p className="text-gray-300 font-karla text-sm leading-relaxed">
                    {analysis.marketContext}
                  </p>
                </div>

                {/* Pros */}
                <div>
                  <h3 className="text-white font-karla font-medium mb-3">Pros</h3>
                  <ul className="space-y-2">
                    {analysis.pros.map((pro: string, index: number) => (
                      <li key={index} className="text-gray-300 font-karla text-sm flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div>
                  <h3 className="text-white font-karla font-medium mb-3">Cons</h3>
                  <ul className="space-y-2">
                    {analysis.cons.map((con: string, index: number) => (
                      <li key={index} className="text-gray-300 font-karla text-sm flex items-start gap-2">
                        <span className="text-red-500 mt-1">⚠</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Confidence */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 font-karla text-sm">Confidence</span>
                    <span className="text-white font-karla font-medium">{analysis.confidence}%</span>
                  </div>
                  <div className="w-full h-2 bg-gradient-to-b from-[#1f1d1d] to-[#181716] rounded-full overflow-hidden border border-[#3a3736]">
                    <div 
                      className="h-full bg-gradient-to-r from-[#3a5a7a] to-[#4a6a8a] transition-all duration-500"
                      style={{ width: `${analysis.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Execute Button - Now actually executes the transaction! */}
                <button 
                  onClick={handleExecuteTransaction}
                  disabled={isExecuting}
                  className="w-full bg-gradient-to-b from-[#2a5a2a] to-[#1f4a1f] hover:from-[#3a6a3a] hover:to-[#2a5a2a] disabled:from-[#2a2727] disabled:to-[#1f1d1d] text-white font-karla font-bold py-3 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] border border-[#3a6a3a] disabled:border-[#3a3736] transition-all active:scale-95 disabled:active:scale-100 mt-2"
                >
                  {isExecuting 
                    ? 'Processing...' 
                    : `Execute ${transactionType === 'buy' ? 'Purchase' : 'Sale'}`
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-[#2e2b2a] to-[#252322] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.1)] border border-[#4a4542] max-w-md w-full animate-in fade-in zoom-in duration-200">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#2a5a2a] to-[#1f4a1f] flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <h2 className="text-white text-2xl font-bold text-center mb-2 font-karla">
              Transaction Successful!
            </h2>
            <p className="text-gray-300 text-center mb-8 font-karla">
              {successMessage}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBuyMore}
                className="flex-1 bg-gradient-to-b from-[#3a5a7a] to-[#2a4a6a] hover:from-[#4a6a8a] hover:to-[#3a5a7a] text-white font-karla font-bold py-3 px-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] border border-[#4a6a8a] transition-all active:scale-95"
              >
                {transactionType === 'buy' ? 'Buy More' : 'Sell More'}
              </button>
              <button
                onClick={handleBackToDashboard}
                className="flex-1 bg-gradient-to-b from-[#2a5a2a] to-[#1f4a1f] hover:from-[#3a6a3a] hover:to-[#2a5a2a] text-white font-karla font-bold py-3 px-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] border border-[#3a6a3a] transition-all active:scale-95"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-[#2e2b2a] to-[#252322] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.1)] border border-[#4a4542] max-w-md w-full animate-in fade-in zoom-in duration-200">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#5a2a2a] to-[#4a1f1f] flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <h2 className="text-white text-2xl font-bold text-center mb-2 font-karla">
              Transaction Failed
            </h2>
            <p className="text-gray-300 text-center mb-8 font-karla">
              {errorMessage}
            </p>

            {/* Action Button */}
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-gradient-to-b from-[#3a5a7a] to-[#2a4a6a] hover:from-[#4a6a8a] hover:to-[#3a5a7a] text-white font-karla font-bold py-3 px-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] border border-[#4a6a8a] transition-all active:scale-95"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


export default function TransactionPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#181716] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#3a5a7a] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-karla text-lg">Loading transaction page...</p>
        </div>
      </div>
    }>
      <TransactionPageContent />
    </Suspense>
  )
}