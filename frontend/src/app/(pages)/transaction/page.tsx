"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface TransactionAnalysis {
  recommendation: 'BUY' | 'SELL' | 'HOLD' | 'CAUTION'
  confidence: number
  summary: string
  pros: string[]
  cons: string[]
  marketContext: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

const mockCoins = [
  { id: 'btc', ticker: 'BTC', name: 'Bitcoin', currentPrice: 67234 },
  { id: 'eth', ticker: 'ETH', name: 'Ethereum', currentPrice: 3456 },
  { id: 'sol', ticker: 'SOL', name: 'Solana', currentPrice: 142 },
  { id: 'ada', ticker: 'ADA', name: 'Cardano', currentPrice: 0.62 },
  { id: 'dot', ticker: 'DOT', name: 'Polkadot', currentPrice: 7.89 },
]

export default function TransactionPage() {
  const [selectedCoin, setSelectedCoin] = useState(mockCoins[0])
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy')
  const [quantity, setQuantity] = useState<string>('')
  const [analysis, setAnalysis] = useState<TransactionAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const totalValue = quantity ? parseFloat(quantity) * selectedCoin.currentPrice : 0

  const handleAnalyze = async () => {
    if (!quantity || parseFloat(quantity) <= 0) return

    setIsAnalyzing(true)
    
    try {
      console.log("Sending request:", {
        crypto: selectedCoin.ticker,
        action: transactionType,
        amount: parseFloat(quantity)
      })

      const res = await fetch("http://localhost:4000/api/gemini-coin-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          crypto: selectedCoin.ticker,
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
      alert(`Failed to fetch analysis: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
    
    setIsAnalyzing(false)
  }

  // Reset analysis when form changes
  useEffect(() => {
    setAnalysis(null)
  }, [selectedCoin, transactionType, quantity])

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
          <div className="bg-gradient-to-b from-[#2e2b2a] to-[#252322] rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.1)] border border-[#4a4542] overflow-y-auto">
            <h2 className="text-white text-xl font-bold mb-6 font-karla">Transaction Details</h2>

            {/* Coin Selection */}
            <div className="mb-6">
              <label className="text-gray-400 text-sm font-karla mb-2 block">Select Coin</label>
              <select
                value={selectedCoin.id}
                onChange={(e) => setSelectedCoin(mockCoins.find(c => c.id === e.target.value)!)}
                className="w-full bg-gradient-to-b from-[#1f1d1d] to-[#181716] text-white font-karla text-base px-4 py-3 rounded-2xl border border-[#3a3736] shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] focus:outline-none focus:border-[#4a4542] transition-colors"
              >
                {mockCoins.map(coin => (
                  <option key={coin.id} value={coin.id}>
                    {coin.ticker} - {coin.name}
                  </option>
                ))}
              </select>
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
                <span className="text-gray-400 text-sm font-karla">Price per {selectedCoin.ticker}</span>
                <span className="text-white font-karla font-medium">${selectedCoin.currentPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-karla">Total Value</span>
                <span className="text-white font-karla font-bold text-base">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!quantity || parseFloat(quantity) <= 0 || isAnalyzing}
              className="w-full bg-gradient-to-b from-[#3a5a7a] to-[#2a4a6a] hover:from-[#4a6a8a] hover:to-[#3a5a7a] disabled:from-[#2a2727] disabled:to-[#1f1d1d] text-white font-karla font-bold py-3 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] border border-[#4a6a8a] disabled:border-[#3a3736] disabled:text-gray-600 transition-all active:scale-95 disabled:active:scale-100">
              {isAnalyzing ? 'Analyzing...' : 'Get AI Analysis'}
            </button>
          </div>

          {/* AI Analysis */}
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

                {/* Execute Button */}
                <button className="w-full bg-gradient-to-b from-[#2a5a2a] to-[#1f4a1f] hover:from-[#3a6a3a] hover:to-[#2a5a2a] text-white font-karla font-bold py-3 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] border border-[#3a6a3a] transition-all active:scale-95 mt-2">
                  Execute {transactionType === 'buy' ? 'Purchase' : 'Sale'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}