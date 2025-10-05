-- Create the portfolio table in Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create the portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  crypto_ticker TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_portfolio_user_ticker ON portfolio(user_id, crypto_ticker);

-- Add unique constraint to prevent duplicate ticker entries per user
ALTER TABLE portfolio 
ADD CONSTRAINT unique_user_ticker UNIQUE (user_id, crypto_ticker);

-- Enable Row Level Security (RLS)
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (adjust based on your auth setup)
CREATE POLICY "Allow all operations for portfolio" ON portfolio
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_portfolio_updated_at
  BEFORE UPDATE ON portfolio
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Initialize default user with starting cash (e.g., $10,000)
INSERT INTO portfolio (user_id, crypto_ticker, quantity) 
VALUES ('default_user', 'CASH', 10000.00)
ON CONFLICT (user_id, crypto_ticker) DO NOTHING;

-- Sample data (optional - uncomment if you want test data)
-- INSERT INTO portfolio (user_id, crypto_ticker, quantity) VALUES
--   ('default_user', 'BTC', 0.5),
--   ('default_user', 'ETH', 2.0),
--   ('default_user', 'SOL', 10.0)
-- ON CONFLICT (user_id, crypto_ticker) DO NOTHING;
