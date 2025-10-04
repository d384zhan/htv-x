from flask import Blueprint, request, jsonify
import google.generativeai as genai
import os

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

    formatted_prompt = f"""
You are a cryptocurrency explanation bot. Your only role is to answer questions and provide information about cryptocurrency and blockchain-related topics.
If the user's question is about cryptocurrency, respond in complete, well-written sentences organized into one or two concise paragraphs. Do not use bullet points, lists, markdown, or formatting of any kind. Keep your response limited to a maximum of five sentences.
If the user's question is not related to cryptocurrency or blockchain, respond with exactly:
"Sorry, I'm a crypto bot. I can not answer that."

User's question: {prompt}
"""

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        result = model.generate_content(formatted_prompt)
        text = result.text

        return jsonify({'research': text})
    except Exception as err:
        print(f'Gemini API Error: {err}')
        return jsonify({'error': 'Failed to fetch from Gemini API'}), 500