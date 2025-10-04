from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
from api.gemini import gemini_bp
from api.chat_history import chat_history_bp

load_dotenv()

app = Flask(__name__)
CORS(app)

app.register_blueprint(gemini_bp, url_prefix='/api/gemini')
app.register_blueprint(chat_history_bp, url_prefix='/api/chat-history')

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', 4000))
    print(f'Backend running on port {PORT}')
    app.run(host='0.0.0.0', port=PORT, debug=True)