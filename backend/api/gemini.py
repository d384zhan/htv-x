from flask import Blueprint, request, jsonify
import google.generativeai as genai
import os
import json

gemini_bp = Blueprint('gemini', __name__)

@gemini_bp.route('', methods=['POST'])
def generate_response():
    data = request.get_json()
    prompt = data.get('prompt')
    api_key = os.getenv('GEMINI_API_KEY')

    if not api_key:
        return jsonify({'error': 'Gemini API key not set'}), 500
    
    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400

    # First, check if this is a plan/transaction request or recommendation request
    plan_check_prompt = f"""
Analyze the user's request and determine if they want crypto transaction plans or recommendations.

User's question: {prompt}

Respond with ONLY a JSON object in this exact format:
{{
  "is_plan": true or false,
  "plans": [
    {{
      "action": "buy" or "sell" or "send",
      "crypto": "BTC" or "ETH" or "SOL" etc,
      "amount": number,
      "reason": "brief reason why this crypto (1 sentence)"
    }}
  ]
}}

Rules:
1. If user asks for specific transaction: create 1 plan with their exact details
2. If user asks for recommendations (like "5 most volatile", "best cryptos", "top coins"): 
   - Provide the ACTUAL list based on real market knowledge
   - Include a brief reason for each crypto
   - Default action is "buy" and amount is 1
3. If it's just a question about crypto: set is_plan to false with empty plans array

Examples:
- "I want to buy 0.5 BTC" -> {{"is_plan": true, "plans": [{{"action": "buy", "crypto": "BTC", "amount": 0.5, "reason": "User requested"}}]}}
- "Show me the 5 most volatile cryptos" -> {{"is_plan": true, "plans": [{{"action": "buy", "crypto": "DOGE", "amount": 1, "reason": "High volatility meme coin"}}, {{"action": "buy", "crypto": "SHIB", "amount": 1, "reason": "Extremely volatile token"}}, ...]}}
- "What are the top 3 altcoins?" -> {{"is_plan": true, "plans": [{{"action": "buy", "crypto": "ETH", "amount": 1, "reason": "Leading smart contract platform"}}, ...]}}
- "What is Bitcoin?" -> {{"is_plan": false, "plans": []}}
"""

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Check if it's a plan
        plan_result = model.generate_content(plan_check_prompt)
        plan_text = plan_result.text.strip()
        
        print(f"Raw plan response: {plan_text}")  # Debug log
        
        try:
            # Remove markdown code blocks if present
            if '```json' in plan_text:
                plan_text = plan_text.split('```json')[1].split('```')[0].strip()
            elif '```' in plan_text:
                plan_text = plan_text.split('```')[1].split('```')[0].strip()
            
            plan_data = json.loads(plan_text)
            
            if plan_data.get('is_plan') and len(plan_data.get('plans', [])) > 0:
                plans = plan_data.get('plans', [])
                
                # Generate a friendly response based on number of plans
                if len(plans) == 1:
                    plan = plans[0]
                    response_text = f"I can help you {plan['action']} {plan['amount']} {plan['crypto']}!"
                else:
                    response_text = f"Here are {len(plans)} crypto options for you. Click any button below to proceed:"
                
                return jsonify({
                    'research': response_text,
                    'is_plan': True,
                    'plans': plans
                })
        except (json.JSONDecodeError, KeyError) as e:
            print(f"JSON parsing error: {e}")
            print(f"Failed to parse: {plan_text}")
            # If parsing fails, treat as regular question
            pass

        # Not a plan, respond normally
        formatted_prompt = f"""
You are a cryptocurrency explanation bot. Your only role is to answer questions and provide information about cryptocurrency and blockchain-related topics.
If the user's question is about cryptocurrency, respond in complete, well-written sentences organized into one or two concise paragraphs. Do not use bullet points, lists, markdown, or formatting of any kind. Keep your response limited to a maximum of five sentences.
If the user's question is not related to cryptocurrency or blockchain, respond with exactly:
"Sorry, I'm a crypto bot. I can not answer that."

User's question: {prompt}
"""

        result = model.generate_content(formatted_prompt)
        text = result.text

        return jsonify({
            'research': text,
            'is_plan': False
        })
        
    except Exception as err:
        print(f'Gemini API Error: {err}')
        return jsonify({'error': 'Failed to fetch from Gemini API'}), 500