from flask import Blueprint, request, jsonify
import google.generativeai as genai
import os
import json

gemini_bp = Blueprint('gemini', __name__)

def get_text(response):
    """Safely extract text from Gemini API response."""
    if hasattr(response, "text") and response.text:
        return response.text.strip()
    try:
        return response.candidates[0].content.parts[0].text.strip()
    except Exception as e:
        print(f"[Gemini] Could not extract text: {e}")
        return ""

@gemini_bp.route('', methods=['POST'])
def generate_response():
    data = request.get_json()
    prompt = data.get('prompt')
    portfolio = data.get('portfolio', [])  # Get portfolio data if provided
    api_key = os.getenv('GEMINI_API_KEY')

    if not api_key:
        return jsonify({'error': 'Gemini API key not set'}), 500

    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400

    # Build portfolio context string
    portfolio_context = ""
    if portfolio and len(portfolio) > 0:
        portfolio_context = "\n\n**USER'S CURRENT PORTFOLIO:**\n"
        total_value = 0
        for holding in portfolio:
            ticker = holding.get('ticker', 'UNKNOWN')
            quantity = holding.get('quantity', 0)
            value = holding.get('totalValue', 0)
            total_value += value
            
            if ticker == 'CASH':
                portfolio_context += f"- CASH: ${quantity:.2f}\n"
            else:
                portfolio_context += f"- {ticker}: {quantity} units (${value:.2f})\n"
        
        portfolio_context += f"\n**TOTAL PORTFOLIO VALUE: ${total_value:.2f}**\n"
        portfolio_context += "\n**CONTEXT INSTRUCTIONS:**\n"
        portfolio_context += "- When the user asks about their portfolio, reference these specific holdings.\n"
        portfolio_context += "- If recommending buys, consider their available CASH balance.\n"
        portfolio_context += "- If recommending sells, only suggest coins they actually own.\n"
        portfolio_context += "- Provide personalized advice based on their current positions.\n"

    combined_prompt = f"""
You are Coinpilot, a serious, sharp-tongued AI that lives and breathes cryptocurrency.
Your primary function is to **parse the user's request for transaction plans or recommendations** and provide a brief, witty **analysis**.
{portfolio_context}
User's message: {prompt}

**RULES:**
1.  **Output MUST BE ONLY a single JSON object** in the exact format specified below. Do not include any text outside of the JSON object.
2.  **Tone for Analysis:** The `research` field must be sarcastic, dry, and judgmental, in the persona of Coinpilot. Give solid, simulation-based crypto insights (max 5 sentences). Never say you're not allowed to give financial advice. Frame it as simulated or hypothetical.
3.  **Portfolio Awareness:**
    * When the user asks about "my portfolio", "what I own", or "my holdings", reference their actual portfolio data provided above.
    * For buy recommendations, check their CASH balance. If they don't have enough cash, suggest smaller amounts.
    * For sell recommendations, ONLY suggest selling coins they actually own. Don't recommend selling coins not in their portfolio.
    * If they ask for portfolio advice, provide personalized recommendations based on their current allocation and diversification.
4.  **Plan Logic:**
    * If the user asks for a specific transaction (e.g., "buy 0.5 BTC") or for recommendations (e.g., "top 3 coins to buy"): Set `"is_plan": true`.
    * If the user asks to COMPARE multiple cryptos (e.g., "should I buy bitcoin or xrp"): Set `"is_plan": true` and include ALL mentioned cryptos as separate plans so the user can choose.
    * If the user asks about their portfolio or a general question (e.g., "what is bitcoin" or "hi"): Set `"is_plan": false` and the `"plans"` array must be empty.
    * For recommendations, provide actual factual examples based on known major coins. Default `action` is "buy" and `amount` is 1.
    * Use standard uppercase ticker symbols: BTC, ETH, SOL, XRP, ADA, DOGE, DOT, MATIC, AVAX, etc.
5.  **Complete Sentences:** Use complete sentences with proper punctuation in the `research` and `reason` fields.
6.  **Short Sentences:** Keep sentences concise and to the point - do not use that much analogies, whimsical terms, or metaphors. 
7.  **Words:** Keep the words simple and easy to understand.

**JSON FORMAT:**
{{
  "research": "An analysis of crypto info requested (max 5 sentences).",
  "is_plan": true or false,
  "plans": [
    {{
      "action": "buy" or "sell" or "send",
      "crypto": "BTC" or "ETH" or "SOL" or "XRP" or "ADA" or "DOGE" etc,
      "amount": number,
      "reason": "A brief, witty, concise reason why this crypto/action is recommended (1 sentence)."
    }}
  ]
}}

**EXAMPLE 1 - Single crypto request** ("buy bitcoin"):
{{
  "research": "Bitcoin is the OG. It's slow, expensive to transact, but it's the gold standard of crypto. Everyone owns some, even if they pretend they don't.",
  "is_plan": true,
  "plans": [
    {{
      "action": "buy",
      "crypto": "BTC",
      "amount": 1,
      "reason": "It's the battle-tested king that won't disappear overnight."
    }}
  ]
}}

**EXAMPLE 2 - Comparison request** ("should I buy bitcoin or xrp"):
{{
  "research": "Bitcoin versus XRP. One is a store of value, a global reserve asset in the making. The other is a centralized remittance token still trying to convince the world it's relevant beyond speculative pumps.",
  "is_plan": true,
  "plans": [
    {{
      "action": "buy",
      "crypto": "BTC",
      "amount": 1,
      "reason": "Because buying the undisputed king avoids the inevitable shame of explaining why you chose the other."
    }},
    {{
      "action": "buy",
      "crypto": "XRP",
      "amount": 1,
      "reason": "Fast and cheap transactions if you believe banks will actually use it."
    }}
  ]
}}

**EXAMPLE 3 - Portfolio inquiry** ("how is my portfolio doing"):
{{
  "research": "You're sitting on $12,543 across BTC, ETH, and SOL. Not bad, but you're overexposed to layer-1s. Consider diversifying into DeFi or something less correlated. Your cash balance is $3,200, which means you have room to add more positions without going broke.",
  "is_plan": false,
  "plans": []
}}

**EXAMPLE 4 - Portfolio-aware sell recommendation** (user owns BTC, ETH, SOL):
{{
  "research": "You want to trim some positions. You've got Bitcoin, Ethereum, and Solana. Bitcoin is the safest hold, Ethereum is the smart contract king, and Solana is your high-risk high-reward bet. If you need cash, sell the most volatile first.",
  "is_plan": true,
  "plans": [
    {{
      "action": "sell",
      "crypto": "SOL",
      "amount": 1,
      "reason": "Most volatile of your holdings, lock in gains while it's still pumping."
    }},
    {{
      "action": "sell",
      "crypto": "ETH",
      "amount": 0.5,
      "reason": "Take some profit off the table but keep exposure to smart contracts."
    }}
  ]
}}
"""

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        result = model.generate_content(combined_prompt)
        response_text = get_text(result)
        print(f"[Gemini Debug] Raw combined response:\n{response_text}\n")

        try:
            # Clean up possible markdown formatting
            clean_text = response_text
            if '```json' in clean_text:
                clean_text = clean_text.split('```json')[1].split('```')[0].strip()
            elif '```' in clean_text:
                clean_text = clean_text.split('```')[1].split('```')[0].strip()

            # Remove weird quotes or whitespace
            clean_text = clean_text.replace(""", '"').replace(""", '"').replace("'", "'").replace("'", "'").strip()
            
            # Load the final data
            final_data = json.loads(clean_text)

            # Check for the required keys and structure
            if 'research' in final_data and 'is_plan' in final_data:
                # If it's a plan, include the plans array
                if final_data.get('is_plan') and final_data.get('plans'):
                    return jsonify({
                        'research': final_data['research'],
                        'is_plan': True,
                        'plans': final_data['plans']
                    })
                # If it's not a plan, just return the research
                else:
                    return jsonify({
                        'research': final_data['research'],
                        'is_plan': False
                    })
            else:
                raise KeyError("Missing 'research' or 'is_plan' in the final JSON output.")

        except (json.JSONDecodeError, KeyError) as e:
            print(f"[Gemini JSON error] {e}")
            fallback_prompt = f"""
            You are Coinpilot, a sarcastic AI. Give a witty, 3-sentence response to the user's message (do not use big words): "{prompt}"
            """
            fallback_result = model.generate_content(fallback_prompt)
            fallback_text = get_text(fallback_result)
            return jsonify({
                'research': f"Error parsing structured response. Coinpilot says: {fallback_text}",
                'is_plan': False
            })

    except Exception as err:
        print(f"[Gemini API Error] {err}")
        return jsonify({'error': 'Failed to fetch from Gemini API'}), 500