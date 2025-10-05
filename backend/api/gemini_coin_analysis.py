from flask import Blueprint, request, jsonify
import google.generativeai as genai
import os
import json

coin_analysis_bp = Blueprint('coin_analysis', __name__)

@coin_analysis_bp.route('', methods=['POST'])
def analyze_coin():
    data = request.get_json()
    crypto = data.get('crypto')
    action = data.get('action') 
    amount = data.get('amount')
    api_key = os.getenv('GEMINI_API_KEY')

    if not api_key:
        return jsonify({'error': 'Gemini API key not set'}), 500
    
    if not crypto:
        return jsonify({'error': 'Crypto symbol is required'}), 400

    analysis_prompt = f"""
    You are a cryptocurrency market analyst. Analyze {crypto} for a potential {action} decision.

    Provide a detailed analysis in JSON format with the following structure:
    {{
      "summary": "2-3 sentence overview of the cryptocurrency",
      "market_context": {{
        "current_trend": "bullish/bearish/neutral",
        "volatility": "high/medium/low",
        "market_sentiment": "brief description"
      }},
      "pros": [
        "Pro point 1",
        "Pro point 2",
        "Pro point 3"
      ],
      "cons": [
        "Con point 1",
        "Con point 2",
        "Con point 3"
      ],
      "recommendation": {{
        "decision": "buy/sell/hold",
        "confidence": 75,
        "risk_level": "low/medium/high"
      }}
    }}

    Important:
    - Be realistic and balanced
    - Base analysis on general market knowledge
    - Confidence should be 0-100
    - For {action} action of {amount} {crypto}, provide relevant context

    Respond with ONLY the JSON object, no additional text.
    """

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        result = model.generate_content(analysis_prompt)
        analysis_text = result.text.strip()
        
        print(f"Raw analysis response: {analysis_text}")  # Debug log
        
        # Remove markdown code blocks if present
        if '```json' in analysis_text:
            analysis_text = analysis_text.split('```json')[1].split('```')[0].strip()
        elif '```' in analysis_text:
            analysis_text = analysis_text.split('```')[1].split('```')[0].strip()
        
        analysis_data = json.loads(analysis_text)
        
        # Add the request details to the response
        analysis_data['request'] = {
            'crypto': crypto,
            'action': action,
            'amount': amount
        }
        
        return jsonify({
            'success': True,
            'analysis': analysis_data
        })
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Failed to parse: {analysis_text}")
        return jsonify({'error': 'Failed to parse analysis response'}), 500
    except Exception as err:
        print(f'Gemini API Error: {err}')
        return jsonify({'error': 'Failed to fetch coin analysis'}), 500