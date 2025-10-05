"""
Test script for historical prices endpoint
Run this file to test the /api/historical-prices endpoint
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:4000"
ENDPOINT = "/api/historical-prices"

def print_separator(title=""):
    """Print a nice separator line"""
    if title:
        print(f"\n{'='*60}")
        print(f"  {title}")
        print(f"{'='*60}\n")
    else:
        print(f"{'='*60}\n")

def test_btc():
    """Test BTC-USD endpoint"""
    print_separator("Test 1: BTC-USD (7 days, ONE_DAY granularity)")
    
    url = f"{BASE_URL}{ENDPOINT}/BTC-USD"
    params = {
        "granularity": "ONE_DAY",
        "days_back": 7
    }
    
    print(f"URL: {url}")
    print(f"Parameters: {params}")
    
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: {data.get('success')}")
            print(f"Ticker: {data.get('ticker')}")
            print(f"Granularity: {data.get('granularity')}")
            print(f"Days Back: {data.get('days_back')}")
            
            if 'data' in data:
                if 'candles' in data['data']:
                    candles = data['data']['candles']
                    print(f"\n📊 Number of candles received: {len(candles)}")
                    
                    if len(candles) > 0:
                        print(f"\nFirst candle sample:")
                        print(json.dumps(candles[0], indent=2))
                else:
                    print(f"\nResponse data structure:")
                    print(json.dumps(data, indent=2))
        else:
            print(f"❌ Error Response:")
            print(response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {str(e)}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

def test_eth():
    """Test ETH-USD endpoint"""
    print_separator("Test 2: ETH-USD (30 days, ONE_DAY granularity)")
    
    url = f"{BASE_URL}{ENDPOINT}/ETH-USD"
    params = {
        "granularity": "ONE_DAY",
        "days_back": 30
    }
    
    print(f"URL: {url}")
    print(f"Parameters: {params}")
    
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: {data.get('success')}")
            print(f"Ticker: {data.get('ticker')}")
            
            if 'data' in data and 'candles' in data['data']:
                candles = data['data']['candles']
                print(f"\n📊 Number of candles received: {len(candles)}")
        else:
            print(f"❌ Error Response:")
            print(response.text[:300])
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {str(e)}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

def test_sol():
    """Test SOL-USD endpoint"""
    print_separator("Test 3: SOL-USD (14 days, ONE_DAY granularity)")
    
    url = f"{BASE_URL}{ENDPOINT}/SOL-USD"
    params = {
        "granularity": "ONE_DAY",
        "days_back": 14
    }
    
    print(f"URL: {url}")
    print(f"Parameters: {params}")
    
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: {data.get('success')}")
            print(f"Ticker: {data.get('ticker')}")
            
            if 'data' in data and 'candles' in data['data']:
                candles = data['data']['candles']
                print(f"\n📊 Number of candles received: {len(candles)}")
        else:
            print(f"❌ Error Response:")
            print(response.text[:300])
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {str(e)}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

def test_invalid_ticker():
    """Test with invalid ticker (should handle gracefully)"""
    print_separator("Test 4: Invalid Ticker (Error Handling)")
    
    url = f"{BASE_URL}{ENDPOINT}/INVALID-TICKER"
    params = {
        "granularity": "ONE_DAY",
        "days_back": 7
    }
    
    print(f"URL: {url}")
    print(f"Parameters: {params}")
    
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"\nStatus Code: {response.status_code}")
        
        data = response.json()
        print(f"Success: {data.get('success')}")
        
        if 'error' in data:
            print(f"Error message (expected): {data.get('error')[:200]}...")
        else:
            print(f"Response: {json.dumps(data, indent=2)[:300]}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {str(e)}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

def main():
    """Main test runner"""
    print("\n" + "="*60)
    print("  HISTORICAL PRICES ENDPOINT TESTING")
    print("="*60)
    print(f"\nBase URL: {BASE_URL}")
    print(f"Endpoint: {ENDPOINT}")
    print("\n⚠️  Make sure your backend is running on port 4000!")
    print("    (Run: python app.py)")
    
    # Run all tests
    test_btc()
    test_eth()
    test_sol()
    test_invalid_ticker()
    
    # Summary
    print_separator("Testing Complete")
    print("✨ All tests finished!\n")

if __name__ == "__main__":
    main()
