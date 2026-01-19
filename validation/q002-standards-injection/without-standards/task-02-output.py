# Task 2: API Response Handler (WITHOUT STANDARDS)

import requests
import json

def fetchData(url, headers=None):
    """Fetch data from API"""
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        print("Request timed out")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None
    except json.JSONDecodeError:
        print("Invalid JSON response")
        return None
    except:
        print("Unknown error occurred")
        return None


def getAPIData(endpoint, apiKey=None):
    headers = {}
    if apiKey:
        headers["Authorization"] = f"Bearer {apiKey}"
    return fetchData(endpoint, headers)
