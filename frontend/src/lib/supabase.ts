import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Database features will not work.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Database Schema:
 * 
 * Table: portfolio
 * Columns:
 * - id: integer (primary key)
 * - crypto_ticker: text (crypto ticker e.g., 'BTC', 'ETH', or 'CASH')
 * - quantity: numeric (quantity owned)
 * - purchase_price: numeric (average purchase price)
 * - created_at: timestamp
 * 
 * Special Entry:
 * - crypto_ticker = 'CASH' represents USD cash balance
 */

export interface PortfolioEntry {
  id?: number
  crypto_ticker: string
  quantity: number
  purchase_price?: number
  created_at?: string
}

/**
 * Get current price for a coin (FALLBACK ONLY)
 * 
 * NOTE: This function uses placeholder prices and should only be used as a fallback.
 * The frontend should fetch live prices from the backend API:
 * https://htv-x.onrender.com/api/historical-prices/{ticker}-USD
 * 
 * This is still used by executeTransaction() for transaction calculations
 * when the frontend hasn't provided a live price.
 */
export function getCurrentPrice(ticker: string): number {
  // Placeholder prices - replace with real API later
  const prices: Record<string, number> = {
    'BTC': 67234,
    'ETH': 3456,
    'SOL': 142,
    'ADA': 0.62,
    'DOT': 7.89,
    'MATIC': 0.89,
    'AVAX': 38.5,
    'LINK': 14.2,
    'UNI': 6.5,
    'ATOM': 9.8,
    'CASH': 1, // $1 per unit
  }
  return prices[ticker.toUpperCase()] || 1 // Default to $1 if unknown
}

/**
 * Execute a crypto transaction (buy or sell)
 * - BUY: Deducts cash, adds crypto, stores purchase price
 * - SELL: Adds cash, deducts crypto
 * 
 * @param ticker - Crypto ticker symbol (e.g., 'BTC', 'ETH')
 * @param quantity - Quantity to buy or sell
 * @param action - 'buy' or 'sell'
 * @param currentPrice - Current market price (optional, uses fallback if not provided)
 */
export async function executeTransaction(
  ticker: string,
  quantity: number,
  action: 'buy' | 'sell',
  currentPrice?: number
): Promise<void> {
  const upperTicker = ticker.toUpperCase()
  
  try {
    // Get current price for the ticker (use provided price or fallback)
    const price = currentPrice || getCurrentPrice(upperTicker)
    const totalCost = quantity * price

    // Get current cash balance
    const { data: cashData, error: cashFetchError } = await supabase
      .from('portfolio')
      .select('*')
      .eq('crypto_ticker', 'CASH')
      .maybeSingle()

    if (cashFetchError) {
      throw cashFetchError
    }

    const currentCash = cashData?.quantity || 0

    // Get current crypto balance
    const { data: cryptoData, error: cryptoFetchError } = await supabase
      .from('portfolio')
      .select('*')
      .eq('crypto_ticker', upperTicker)
      .maybeSingle()

    if (cryptoFetchError) {
      throw cryptoFetchError
    }

    const currentCrypto = cryptoData?.quantity || 0

    if (action === 'buy') {
      // CHECK: Sufficient cash to purchase
      if (currentCash < totalCost) {
        throw new Error(`Insufficient cash to complete this purchase`)
      }

      // Calculate new average purchase price
      const existingPurchasePrice = cryptoData?.purchase_price || 0
      const newTotalQuantity = currentCrypto + quantity
      const newAveragePurchasePrice = currentCrypto > 0
        ? ((currentCrypto * existingPurchasePrice) + (quantity * price)) / newTotalQuantity
        : price

      // Deduct cash
      const newCashAmount = currentCash - totalCost
      await updateOrCreateEntry('CASH', newCashAmount, cashData?.id, undefined)

      // Add crypto with purchase price
      await updateOrCreateEntry(upperTicker, newTotalQuantity, cryptoData?.id, newAveragePurchasePrice)

    } else if (action === 'sell') {
      // CHECK: Sufficient crypto to sell
      if (currentCrypto < quantity) {
        throw new Error(`Insufficient ${upperTicker} to complete this sale`)
      }

      // Add cash
      const newCashAmount = currentCash + totalCost
      await updateOrCreateEntry('CASH', newCashAmount, cashData?.id)

      // Deduct crypto
      const newCryptoAmount = currentCrypto - quantity
      if (newCryptoAmount === 0) {
        // Delete entry if quantity becomes 0
        if (cryptoData?.id) {
          await supabase.from('portfolio').delete().eq('id', cryptoData.id)
        }
      } else {
        await updateOrCreateEntry(upperTicker, newCryptoAmount, cryptoData?.id)
      }
    }

    console.log(`Successfully ${action === 'buy' ? 'bought' : 'sold'} ${quantity} ${upperTicker} for $${totalCost.toFixed(2)}`)
  } catch (error) {
    console.error('Transaction error:', error)
    throw error
  }
}

/**
 * Helper function to update existing entry or create new one
 */
async function updateOrCreateEntry(
  ticker: string,
  quantity: number,
  existingId?: number,
  purchasePrice?: number
): Promise<void> {
  if (existingId) {
    // Update existing
    const updateData: any = { quantity }
    if (purchasePrice !== undefined) {
      updateData.purchase_price = purchasePrice
    }
    
    const { error } = await supabase
      .from('portfolio')
      .update(updateData)
      .eq('id', existingId)
    
    if (error) throw error
  } else {
    // Create new
    const insertData: any = {
      crypto_ticker: ticker,
      quantity
    }
    if (purchasePrice !== undefined) {
      insertData.purchase_price = purchasePrice
    }
    
    const { error } = await supabase
      .from('portfolio')
      .insert([insertData])
    
    if (error) throw error
  }
}

/**
 * Fetch the user's entire portfolio (including CASH)
 * 
 * @returns Array of portfolio entries
 */
export async function getPortfolio(): Promise<PortfolioEntry[]> {
  try {
    const { data, error } = await supabase
      .from('portfolio')
      .select('*')
      .order('crypto_ticker', { ascending: true })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    throw error
  }
}

/**
 * Get the quantity of a specific coin owned
 * 
 * @param ticker - Crypto ticker symbol or 'CASH'
 * @returns Quantity owned (0 if not in portfolio)
 */
export async function getCoinQuantity(ticker: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('portfolio')
      .select('quantity')
      .eq('crypto_ticker', ticker.toUpperCase())
      .maybeSingle()

    if (error) throw error

    return data?.quantity || 0
  } catch (error) {
    console.error('Error fetching coin quantity:', error)
    return 0
  }
}

/**
 * Get cash balance
 */
export async function getCashBalance(): Promise<number> {
  return getCoinQuantity('CASH')
}
