from flask import Blueprint, request, jsonify
import jwt
from cryptography.hazmat.primitives import serialization
import time
import secrets
import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Create Blueprint for historical prices API
historical_prices_bp = Blueprint('historical_prices', __name__)

key_name = os.getenv('COINBASE_API_KEY_NAME')
key_secret = os.getenv('COINBASE_API_KEY_SECRET')

# Build JWT Access token
def build_jwt(uri):
    """
    Generate a JWT token for Coinbase API authentication
    
    Args:
        uri: The request URI in format "METHOD host/path"
    
    Returns:
        str: JWT token valid for 2 minutes
    """
    private_key_bytes = key_secret.encode('utf-8')
    private_key = serialization.load_pem_private_key(private_key_bytes, password=None)
    jwt_payload = {
        'sub': key_name,
        'iss': "cdp",
        'nbf': int(time.time()),
        'exp': int(time.time()) + 120,
        'uri': uri,
    }
    jwt_token = jwt.encode(
        jwt_payload,
        private_key,
        algorithm='ES256',
        headers={'kid': key_name, 'nonce': secrets.token_hex()},
    )
    return jwt_token

@historical_prices_bp.route('/<ticker>', methods=['GET'])
def get_historical_prices(ticker):
    """
    API endpoint to get historical prices for a ticker
    
    URL: /api/historical-prices/<ticker>
    Query params (optional):
        - granularity: ONE_DAY (default), ONE_HOUR, etc.
        - days_back: 350 (default)
    
    Example: /api/historical-prices/BTC-USD?granularity=ONE_DAY&days_back=350
    """
    # Get optional query parameters
    granularity = request.args.get('granularity', 'ONE_DAY')
    days_back = request.args.get('days_back', 350, type=int)
    
    host = "api.coinbase.com"
    path = f"/api/v3/brokerage/products/{ticker}/candles"
    method = "GET"
    
    # Build URI for JWT (without query parameters)
    uri = f"{method} {host}{path}"
    
    try:
        # Generate JWT token
        jwt_token = build_jwt(uri)
        
        # Build full URL
        url = f"https://{host}{path}"
        
        # Query parameters
        params = {
            "start": str(int(time.time()) - (days_back * 86400)),  # 86400 seconds = 1 day
            "end": str(int(time.time())),
            "granularity": granularity
        }
        
        # Set up headers
        headers = {
            "Authorization": f"Bearer {jwt_token}",
            "Content-Type": "application/json"
        }
        
        # Make the request
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            # bug fixing
            # print("-------------------")
            # print(response.json())
            # print("-------------------")
            
            
            return jsonify({
                'success': True,
                'ticker': ticker.upper(),
                'granularity': granularity,
                'days_back': days_back,
                'data': response.json()
            }), 200
        else:
            return jsonify({
                'success': False,
                'ticker': ticker.upper(),
                'error': f"HTTP {response.status_code}: {response.text}"
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'ticker': ticker.upper(),
            'error': str(e)
        }), 500

# Example usage for testing
if __name__ == "__main__":
    # This is just for testing the helper function directly
    print("Testing get_historical_prices function...")
    print("Note: To test the API endpoint, run app.py instead")

