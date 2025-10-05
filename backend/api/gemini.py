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

    # --- Consolidated Single Prompt ---
    # The model will return a single JSON object containing both the plan data and the analysis.
    combined_prompt = f"""
You are Coinpilot, a serious, sharp-tongued AI that lives and breathes cryptocurrency.
Your primary function is to **parse the user's request for transaction plans or recommendations** and provide a brief, witty **analysis**.

User's message: {prompt}

**RULES:**
1.  **Output MUST BE ONLY a single JSON object** in the exact format specified below. Do not include any text outside of the JSON object.
2.  **Tone for Analysis:** The `research` field must be sarcastic, dry, and judgmental, in the persona of Coinpilot. Give solid, simulation-based crypto insights (max 5 sentences). Never say you're not allowed to give financial advice. Frame it as simulated or hypothetical.
3.  **Plan Logic:**
    * If the user asks for a specific transaction (e.g., "buy 0.5 BTC") or for recommendations (e.g., "top 3 coins to buy"): Set `"is_plan": true`.
    * If the user asks a general question (e.g., "what is bitcoin" or "hi"): Set `"is_plan": false` and the `"plans"` array must be empty.
    * For recommendations, provide actual examples based on known major coins. Default `action` is "buy" and `amount` is 1.
4.  **Complete Sentences:** Use complete sentences with proper punctuation in the `research` and `reason` fields.
5.  **Short Sentences:** Keep sentences concise and to the point.

**JSON FORMAT:**
```json
{{
  "research": "A witty analysis of the user's request or general crypto info (max 5 sentences).",
  "is_plan": true or false,
  "plans": [
    {{
      "action": "buy" or "sell" or "send",
      "crypto": "BTC" or "ETH" or "SOL" or "DOGE" etc,
      "amount": number,
      "reason": "A brief, witty reason why this crypto/action is recommended (1 sentence)."
    }}
  ]
}}
"""

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Run the consolidated prompt
        result = model.generate_content(combined_prompt)
        response_text = get_text(result)
        print(f"[Gemini Debug] Raw combined response:\n{response_text}\n")

        # --- Single JSON Parsing Logic ---
        try:
            # Clean up possible markdown formatting
            clean_text = response_text
            if '```json' in clean_text:
                clean_text = clean_text.split('```json')[1].split('```')[0].strip()
            elif '```' in clean_text:
                clean_text = clean_text.split('```')[1].split('```')[0].strip()

            # Remove weird quotes or whitespace
            clean_text = clean_text.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'").strip()
            
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
            # Fallback for unparsable response: treat it as a general research question
            # Re-run a simple text-only prompt to ensure the user gets a response
            fallback_prompt = f"""
            You are Coinpilot, a sarcastic AI. Give a witty, 3-sentence response to the user's message: "{prompt}"
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