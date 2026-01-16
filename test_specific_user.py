#!/usr/bin/env python3

import requests
import json

def test_specific_user_login():
    """Test login with testsubscriber@test.com / Test123! as mentioned in review request"""
    base_url = "https://resume-bug-fix.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    print("🔐 Testing specific user login: testsubscriber@test.com")
    
    # Test login
    payload = {
        "email": "testsubscriber@test.com",
        "password": "Test123!"
    }
    
    try:
        response = requests.post(f"{api_url}/user/login", json=payload, timeout=10)
        print(f"Login Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Login Success: {data.get('success')}")
            if data.get('user'):
                user = data['user']
                print(f"User ID: {user.get('id')}")
                print(f"User Email: {user.get('email')}")
                print(f"User Subscription: {user.get('subscription')}")
                
                # Test upgrade calculation with this user
                if data.get('token'):
                    token = data['token']
                    headers = {"Authorization": f"Bearer {token}"}
                    
                    print("\n⬆️ Testing upgrade calculation...")
                    upgrade_payload = {"newTier": "professional"}
                    upgrade_response = requests.post(f"{api_url}/subscriptions/calculate-upgrade", json=upgrade_payload, headers=headers, timeout=10)
                    print(f"Upgrade Status: {upgrade_response.status_code}")
                    
                    if upgrade_response.status_code == 200:
                        upgrade_data = upgrade_response.json()
                        print(f"Upgrade Data: {json.dumps(upgrade_data, indent=2)}")
                    else:
                        try:
                            error_data = upgrade_response.json()
                            print(f"Upgrade Error: {error_data}")
                        except:
                            print(f"Upgrade Response: {upgrade_response.text}")
        else:
            try:
                error_data = response.json()
                print(f"Login Error: {error_data}")
            except:
                print(f"Login Response: {response.text}")
                
    except Exception as e:
        print(f"Exception: {str(e)}")

if __name__ == "__main__":
    test_specific_user_login()