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
    api_key = os.getenv('GEMINI_API_KEY')

    if not api_key:
        return jsonify({'error': 'Gemini API key not set'}), 500

    if not prompt:
        return jsonify({'error': 'Prompt is required'}), 400

    # First: classify if it's a plan or not
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

MUST FOLLOW OR ELSE 100 GRANDMAS WILL DIE Rules:
1. If user asks for specific transaction: create 1 plan with their exact details.
2. If user asks for recommendations (like "5 most volatile", "best cryptos", "top coins"): 
   - Provide actual examples based on known major coins.
   - Include a brief reason for each crypto.
   - Default action is "buy" and amount is 1.
3. If it's just a question (like "what is bitcoin" or "hi"), set is_plan = false with an empty plans array.
4. If unsure, set is_plan = false.

Examples:
- "I want to buy 0.5 BTC" -> {{"is_plan": true, "plans": [{{"action": "buy", "crypto": "BTC", "amount": 0.5, "reason": "User requested"}}]}}
- "Show me the 5 most volatile cryptos" -> {{"is_plan": true, "plans": [{{"action": "buy", "crypto": "DOGE", "amount": 1, "reason": "High volatility meme coin"}}, ...]}}
- "What is Bitcoin?" -> {{"is_plan": false, "plans": []}}
- "hi" -> {{"is_plan": false, "plans": []}}
"""

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Check if it's a plan
        plan_result = model.generate_content(plan_check_prompt)
        plan_text = get_text(plan_result)
        print(f"[Gemini Debug] Raw plan response:\n{plan_text}\n")

        try:
            # Clean up possible markdown formatting
            clean_text = plan_text
            if '```json' in clean_text:
                clean_text = clean_text.split('```json')[1].split('```')[0].strip()
            elif '```' in clean_text:
                clean_text = clean_text.split('```')[1].split('```')[0].strip()

            # Remove weird quotes or whitespace
            clean_text = clean_text.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'").strip()

            plan_data = json.loads(clean_text)

            # Handle valid plan
            if plan_data.get('is_plan') and len(plan_data.get('plans', [])) > 0:
                plans = plan_data['plans']

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
            print(f"[Gemini JSON error] {e}")
            print(f"[Gemini] Failed to parse plan JSON:\n{plan_text}\n")

        # Fallback: Normal informational mode
        formatted_prompt = f"""
You are a cryptocurrency explanation bot. Your only role is to answer questions and provide information about cryptocurrency and blockchain-related topics.
If the user's question is about cryptocurrency, respond in one or two concise paragraphs (max 5 sentences).
If the user's question is not related to cryptocurrency or blockchain, respond exactly with:
"Sorry, I'm a crypto bot. I can not answer that."

User's question: {prompt}
"""

        result = model.generate_content(formatted_prompt)
        text = get_text(result)

        return jsonify({
            'research': text,
            'is_plan': False
        })

    except Exception as err:
        print(f"[Gemini API Error] {err}")
        return jsonify({'error': 'Failed to fetch from Gemini API'}), 500
