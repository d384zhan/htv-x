# Coinpilot: AI-Powered Cryptocurrency Learning Simulator  

Coinpilot is an interactive cryptocurrency trading simulator powered by AI-driven learning and market simulation. It provides a risk-free, hands-on environment for users to explore crypto trading, understand market dynamics, and receive personalized insights - all without risking real money.

<img width="1859" height="890" alt="image" src="https://github.com/user-attachments/assets/a139a29f-63ac-4291-b878-d8c749e1a2f8" />


 # Inspiration

Cryptocurrency trading can be intimidating for beginners - unpredictable markets, complex terms, and no room for error. We wanted to make crypto education more approachable, interactive, and fun.  

Coinpilot bridges that gap by combining AI tutoring with live market simulation, turning abstract trading concepts into something visual, conversational, and intuitive.  
 
# What It Does

Coinpilot offers a realistic crypto trading experience powered by an AI assistant.   
Users can:
- Chat with an AI crypto assistant that explains trends, concepts, and strategies.
- Simulate trades and instantly see how market changes affect their portfolio.
- View real-time graphs and portfolio data using interactive charts.
- Receive AI-driven analysis of every transaction and their overall performance.
  
This combination of education, simulation, and feedback helps users build confidence before entering real crypto markets.

# How We Built It
Frontend
- Framework: Next.js + React
- Styling: Tailwind CSS
- Visualization: Recharts / Chart.js for dynamic market and portfolio graphs
- State Management: React Context API for user session and portfolio updates
  
Backend
- Framework: Flask
- AI Engine: Google Gemini API for generating educational and market-aware responses
- Database: Supabase for storing user portfolios, simulated transactions, and session data  

Each user’s session data is reloaded and analyzed on startup, allowing the AI to provide context-aware portfolio insights and performance feedback across multiple sessions.  

Custom market simulation module that updates asset values and tracks user holdings in real time.  
 
# Key Features

AI Conversational Agent: Explains crypto concepts, analyzes transactions, and guides learning.

Market Simulator: Mimics real-world market volatility and trade execution.

Portfolio Tracking: Persists simulated holdings via Supabase.

Visual Insights: Interactive graphs and transaction history analysis.

