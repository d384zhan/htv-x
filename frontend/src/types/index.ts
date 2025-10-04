/**
 * Core data types for the crypto portfolio application
 * These interfaces are designed to match expected backend API responses
 */

/**
 * Represents a cryptocurrency
 */
export interface Coin {
  id: string
  ticker: string
  name: string
  iconUrl?: string
  currentPrice: number // USD price per coin
  priceChange24h: number // Percentage change in last 24 hours
}

/**
 * Represents a user's holding of a specific coin
 */
export interface PortfolioHolding {
  coinId: string
  ticker: string
  name: string
  iconUrl?: string
  quantity: number // Amount of coins owned
  totalValue: number // Current USD value of holdings
  averageBuyPrice: number // Average price paid per coin
}

/**
 * Summary of user's entire portfolio
 */
export interface PortfolioSummary {
  totalValue: number // Total USD value of all holdings
  totalInvested: number // Total amount invested
  totalProfitLoss: number // Total profit/loss in USD
  profitLossPercentage: number // Total profit/loss as percentage
  holdings: PortfolioHolding[]
}

/**
 * Detailed information about a specific coin
 */
export interface CoinDetails extends Coin {
  marketCap: number
  volume24h: number
  circulatingSupply: number
  maxSupply?: number
  priceHistory: PriceDataPoint[] // Historical price data for charting
}

/**
 * Price data point for charting
 */
export interface PriceDataPoint {
  timestamp: number // Unix timestamp
  date: string // Formatted date string
  price: number // USD price at this time
}

/**
 * Transaction types
 */
export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL'
}

/**
 * Represents a transaction
 */
export interface Transaction {
  id?: string // Optional for new transactions
  coinId: string
  ticker: string
  type: TransactionType
  quantity: number
  pricePerCoin: number
  totalAmount: number // quantity * pricePerCoin
  timestamp?: number // When transaction occurred
  notes?: string
}

/**
 * AI analysis of a proposed transaction
 */
export interface TransactionAnalysis {
  recommendation: 'BUY' | 'SELL' | 'HOLD' | 'CAUTION'
  confidence: number // 0-100
  summary: string
  pros: string[]
  cons: string[]
  marketContext: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

/**
 * Chat message with AI
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

/**
 * Draggable chat window state
 */
export interface ChatWindowState {
  isMinimized: boolean
  position: {
    x: number
    y: number
  }
  messages: ChatMessage[]
}
