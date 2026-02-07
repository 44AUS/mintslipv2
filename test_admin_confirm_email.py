#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class AdminConfirmEmailTester:
    def __init__(self, base_url="https://user-counter-update.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"

    def test_admin_confirm_user_email(self):
        """Test PUT /api/admin/users/{user_id}/verify endpoint"""
        try:
            import time
            timestamp = int(time.time())
            
            print("🧪 Testing Admin Confirm User Email Endpoint")
            print("=" * 50)
            
            # Step 1: Create a test user with emailVerified=false (sign up a new user)
            test_email = f"emailverify_test_{timestamp}@test.com"
            signup_payload = {
                "email": test_email,
                "password": "TestPassword123!",
                "name": "Email Verify Test User"
            }
            
            print(f"1️⃣ Creating test user: {test_email}")
            signup_response = requests.post(f"{self.api_url}/user/signup", json=signup_payload, timeout=10)
            if signup_response.status_code != 200:
                print(f"❌ Failed to create test user: {signup_response.status_code}")
                print(f"Response: {signup_response.text}")
                return False
            
            signup_data = signup_response.json()
            if not signup_data.get("success") or not signup_data.get("user"):
                print(f"❌ Invalid signup response: {signup_data}")
                return False
            
            test_user_id = signup_data["user"]["id"]
            print(f"✅ Test user created with ID: {test_user_id}")
            
            # Verify user has emailVerified=false initially
            if signup_data["user"].get("emailVerified") != False:
                print(f"❌ Test user should have emailVerified=false initially, got: {signup_data['user'].get('emailVerified')}")
                return False
            
            print("✅ User has emailVerified=false initially")
            
            # Step 2: Test endpoint requires admin authentication (should return 401 without token)
            verify_url = f"{self.api_url}/admin/users/{test_user_id}/verify"
            print(f"2️⃣ Testing authentication requirement")
            unauth_response = requests.put(verify_url, timeout=10)
            
            if unauth_response.status_code != 401:
                print(f"❌ Expected 401 without auth, got: {unauth_response.status_code}")
                return False
            
            print("✅ Endpoint correctly requires authentication (401 without token)")
            
            # Step 3: Login as admin with specified credentials
            print(f"3️⃣ Attempting admin login")
            # First try the specified credentials, then fallback to default admin
            admin_login_payload = {
                "email": "austindflatt@gmail.com",
                "password": "Summer3024$$"
            }
            
            admin_response = requests.post(f"{self.api_url}/admin/login", json=admin_login_payload, timeout=10)
            
            # If specified admin fails, try default admin
            if admin_response.status_code != 200:
                print(f"⚠️ Specified admin login failed ({admin_response.status_code}), trying default admin")
                admin_login_payload = {
                    "email": "admin@mintslip.com",
                    "password": "MINTSLIP2025!"
                }
                admin_response = requests.post(f"{self.api_url}/admin/login", json=admin_login_payload, timeout=10)
            
            if admin_response.status_code != 200:
                print(f"❌ Admin login failed: {admin_response.status_code}")
                print(f"Response: {admin_response.text}")
                return False
            
            admin_data = admin_response.json()
            if not admin_data.get("success") or not admin_data.get("token"):
                print(f"❌ Invalid admin login response: {admin_data}")
                return False
            
            admin_token = admin_data["token"]
            admin_email = admin_data.get("admin", {}).get("email", "unknown")
            print(f"✅ Admin login successful: {admin_email}")
            
            # Step 4: Use admin token to call PUT /api/admin/users/{user_id}/verify
            print(f"4️⃣ Calling admin verify endpoint")
            headers = {"Authorization": f"Bearer {admin_token}"}
            verify_response = requests.put(verify_url, headers=headers, timeout=10)
            
            if verify_response.status_code != 200:
                print(f"❌ Admin verify failed: {verify_response.status_code}")
                print(f"Response: {verify_response.text}")
                return False
            
            verify_data = verify_response.json()
            print(f"✅ Admin verify response: {verify_data}")
            
            # Step 5: Verify the response contains success=true, emailVerified=true
            print(f"5️⃣ Validating response structure")
            if not verify_data.get("success"):
                print(f"❌ Response success=false: {verify_data}")
                return False
            
            if verify_data.get("emailVerified") != True:
                print(f"❌ Response emailVerified should be true, got: {verify_data.get('emailVerified')}")
                return False
            
            print("✅ Response contains success=true and emailVerified=true")
            
            # Step 6: Verify the user in database now has emailVerified=true
            # Check via GET /api/admin/users with search on test user email
            print(f"6️⃣ Verifying database update")
            search_params = {"search": test_email}
            users_response = requests.get(f"{self.api_url}/admin/users", headers=headers, params=search_params, timeout=10)
            
            if users_response.status_code != 200:
                print(f"❌ Failed to search users: {users_response.status_code}")
                return False
            
            users_data = users_response.json()
            if not users_data.get("success") or not users_data.get("users"):
                print(f"❌ Invalid users search response: {users_data}")
                return False
            
            # Find the test user in the results
            test_user = None
            for user in users_data["users"]:
                if user.get("email") == test_email:
                    test_user = user
                    break
            
            if not test_user:
                print(f"❌ Test user not found in search results")
                return False
            
            if test_user.get("emailVerified") != True:
                print(f"❌ User emailVerified should be true in database, got: {test_user.get('emailVerified')}")
                return False
            
            print("✅ Database shows emailVerified=true for the user")
            
            print("\n🎉 ALL TESTS PASSED!")
            print("✅ Admin Confirm User Email endpoint is working correctly")
            return True
            
        except Exception as e:
            print(f"❌ Exception occurred: {str(e)}")
            return False

if __name__ == "__main__":
    tester = AdminConfirmEmailTester()
    success = tester.test_admin_confirm_user_email()
    sys.exit(0 if success else 1)