#!/usr/bin/env python3
"""
Focused test for new admin dashboard features
"""
import requests
import sys
import json
import time
from datetime import datetime

class NewAdminFeaturesTester:
    def __init__(self, base_url="https://verify-dashboard-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None

    def setup_admin_auth(self):
        """Setup admin authentication"""
        # Setup admin account
        setup_response = requests.post(f"{self.api_url}/admin/setup", timeout=10)
        print(f"Admin setup: {setup_response.status_code}")
        
        # Login as admin
        login_payload = {
            "email": "admin@mintslip.com",
            "password": "MINTSLIP2025!"
        }
        login_response = requests.post(f"{self.api_url}/admin/login", json=login_payload, timeout=10)
        if login_response.status_code == 200:
            data = login_response.json()
            self.admin_token = data.get("token")
            print(f"✅ Admin login successful, token obtained")
            return True
        else:
            print(f"❌ Admin login failed: {login_response.status_code}")
            return False

    def test_admin_update_user_subscription_detailed(self):
        """Detailed test of admin update user subscription endpoint"""
        print("\n🔧 Testing Admin Update User Subscription Endpoint")
        print("=" * 60)
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Create a test user
        timestamp = int(time.time())
        user_payload = {
            "email": f"testuser{timestamp}@mintslip.com",
            "password": "TestPassword123!",
            "name": "Test User for Subscription"
        }
        
        user_response = requests.post(f"{self.api_url}/user/signup", json=user_payload, timeout=10)
        if user_response.status_code != 200:
            print(f"❌ Failed to create test user: {user_response.status_code}")
            return False
        
        user_data = user_response.json()
        user_id = user_data["user"]["id"]
        print(f"✅ Test user created: {user_id}")
        
        # Test 1: Update to basic tier
        print("\n📋 Test 1: Update to basic tier")
        payload = {"tier": "basic"}
        response = requests.put(
            f"{self.api_url}/admin/users/{user_id}/subscription", 
            json=payload, 
            headers=headers, 
            timeout=10
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            subscription = data.get("subscription", {})
            if subscription.get("tier") == "basic" and subscription.get("adminAssigned"):
                print("✅ Basic tier assignment successful")
            else:
                print("❌ Basic tier assignment failed")
                return False
        else:
            print(f"❌ Basic tier assignment failed: {response.text}")
            return False
        
        # Test 2: Update to pro tier
        print("\n📋 Test 2: Update to pro tier")
        payload = {"tier": "pro"}
        response = requests.put(
            f"{self.api_url}/admin/users/{user_id}/subscription", 
            json=payload, 
            headers=headers, 
            timeout=10
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            if data.get("subscription", {}).get("tier") == "pro":
                print("✅ Pro tier assignment successful")
            else:
                print("❌ Pro tier assignment failed")
                return False
        else:
            print(f"❌ Pro tier assignment failed: {response.text}")
            return False
        
        # Test 3: Update to unlimited tier
        print("\n📋 Test 3: Update to unlimited tier")
        payload = {"tier": "unlimited"}
        response = requests.put(
            f"{self.api_url}/admin/users/{user_id}/subscription", 
            json=payload, 
            headers=headers, 
            timeout=10
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            if data.get("subscription", {}).get("tier") == "unlimited":
                print("✅ Unlimited tier assignment successful")
            else:
                print("❌ Unlimited tier assignment failed")
                return False
        else:
            print(f"❌ Unlimited tier assignment failed: {response.text}")
            return False
        
        # Test 4: Remove subscription (set to null)
        print("\n📋 Test 4: Remove subscription")
        payload = {"tier": None}
        response = requests.put(
            f"{self.api_url}/admin/users/{user_id}/subscription", 
            json=payload, 
            headers=headers, 
            timeout=10
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            if data.get("subscription") is None:
                print("✅ Subscription removal successful")
            else:
                print("❌ Subscription removal failed")
                return False
        else:
            print(f"❌ Subscription removal failed: {response.text}")
            return False
        
        # Test 5: Verify downloads are reset to 0 when subscription changes
        print("\n📋 Test 5: Verify downloads reset when subscription changes")
        payload = {"tier": "basic"}
        response = requests.put(
            f"{self.api_url}/admin/users/{user_id}/subscription", 
            json=payload, 
            headers=headers, 
            timeout=10
        )
        if response.status_code == 200:
            # Get user details to check downloads
            users_response = requests.get(f"{self.api_url}/admin/users", headers=headers, timeout=10)
            if users_response.status_code == 200:
                users_data = users_response.json()
                test_user = None
                for user in users_data.get("users", []):
                    if user.get("id") == user_id:
                        test_user = user
                        break
                
                if test_user and test_user.get("downloadsUsed") == 0:
                    print("✅ Downloads reset to 0 when subscription changed")
                else:
                    print(f"❌ Downloads not reset properly: {test_user.get('downloadsUsed') if test_user else 'User not found'}")
                    return False
            else:
                print("❌ Could not verify downloads reset")
                return False
        else:
            print("❌ Could not set subscription for downloads test")
            return False
        
        return True

    def test_admin_revenue_by_period_detailed(self):
        """Detailed test of admin revenue by period endpoint"""
        print("\n💰 Testing Admin Revenue by Period Endpoint")
        print("=" * 60)
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test 1: Get all-time revenue (no parameters)
        print("\n📊 Test 1: Get all-time revenue")
        response = requests.get(f"{self.api_url}/admin/revenue", headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            required_fields = ["success", "revenue", "purchaseCount", "period"]
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                print(f"❌ Missing fields: {missing_fields}")
                return False
            else:
                print(f"✅ All-time revenue: ${data['revenue']}, Purchases: {data['purchaseCount']}")
        else:
            print(f"❌ All-time revenue test failed: {response.text}")
            return False
        
        # Test 2: Get revenue with startDate parameter
        print("\n📊 Test 2: Get revenue with startDate")
        start_date = "2024-01-01T00:00:00Z"
        params = {"startDate": start_date}
        response = requests.get(f"{self.api_url}/admin/revenue", headers=headers, params=params, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            period = data.get("period", {})
            if period.get("startDate") == start_date:
                print(f"✅ StartDate filter working: ${data['revenue']}, Purchases: {data['purchaseCount']}")
            else:
                print(f"❌ StartDate filter failed: {period}")
                return False
        else:
            print(f"❌ StartDate test failed: {response.text}")
            return False
        
        # Test 3: Get revenue with both startDate and endDate
        print("\n📊 Test 3: Get revenue with date range")
        start_date = "2024-01-01T00:00:00Z"
        end_date = "2024-12-31T23:59:59Z"
        params = {"startDate": start_date, "endDate": end_date}
        response = requests.get(f"{self.api_url}/admin/revenue", headers=headers, params=params, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            period = data.get("period", {})
            if period.get("startDate") == start_date and period.get("endDate") == end_date:
                print(f"✅ Date range filter working: ${data['revenue']}, Purchases: {data['purchaseCount']}")
            else:
                print(f"❌ Date range filter failed: {period}")
                return False
        else:
            print(f"❌ Date range test failed: {response.text}")
            return False
        
        return True

    def test_full_admin_flow_detailed(self):
        """Detailed test of full admin flow"""
        print("\n🔄 Testing Full Admin Flow")
        print("=" * 60)
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Step 1: Get list of users
        print("\n👥 Step 1: Get list of users")
        response = requests.get(f"{self.api_url}/admin/users", headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            users_data = response.json()
            print(f"Users found: {users_data.get('total', 0)}")
            print("✅ Users list retrieved successfully")
        else:
            print(f"❌ Failed to get users list: {response.text}")
            return False
        
        # Step 2: Create a test user
        print("\n👤 Step 2: Create test user")
        timestamp = int(time.time())
        user_payload = {
            "email": f"flowtest{timestamp}@mintslip.com",
            "password": "TestPassword123!",
            "name": "Flow Test User"
        }
        response = requests.post(f"{self.api_url}/user/signup", json=user_payload, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            user_data = response.json()
            test_user_id = user_data["user"]["id"]
            print(f"✅ Test user created: {test_user_id}")
        else:
            print(f"❌ Failed to create test user: {response.text}")
            return False
        
        # Step 3: Update user's subscription
        print("\n📋 Step 3: Update user subscription to basic")
        payload = {"tier": "basic"}
        response = requests.put(
            f"{self.api_url}/admin/users/{test_user_id}/subscription", 
            json=payload, 
            headers=headers, 
            timeout=10
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            subscription_data = response.json()
            print(f"✅ Subscription updated: {subscription_data.get('subscription', {}).get('tier')}")
        else:
            print(f"❌ Failed to update subscription: {response.text}")
            return False
        
        # Step 4: Verify subscription in users list
        print("\n✅ Step 4: Verify subscription in users list")
        response = requests.get(f"{self.api_url}/admin/users", headers=headers, timeout=10)
        if response.status_code == 200:
            users_data = response.json()
            updated_user = None
            for user in users_data.get("users", []):
                if user.get("id") == test_user_id:
                    updated_user = user
                    break
            
            if updated_user and updated_user.get("subscription"):
                subscription = updated_user["subscription"]
                if subscription.get("tier") == "basic" and subscription.get("adminAssigned"):
                    print(f"✅ Subscription verified: tier={subscription['tier']}, adminAssigned={subscription['adminAssigned']}")
                else:
                    print(f"❌ Subscription verification failed: {subscription}")
                    return False
            else:
                print("❌ User subscription not found after update")
                return False
        else:
            print(f"❌ Failed to verify subscription: {response.text}")
            return False
        
        # Step 5: Get revenue stats
        print("\n💰 Step 5: Get revenue stats")
        response = requests.get(f"{self.api_url}/admin/revenue", headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            revenue_data = response.json()
            print(f"✅ Revenue stats: ${revenue_data.get('revenue', 0)}, {revenue_data.get('purchaseCount', 0)} purchases")
        else:
            print(f"❌ Failed to get revenue stats: {response.text}")
            return False
        
        print("\n🎉 Full admin flow completed successfully!")
        return True

    def run_tests(self):
        """Run all new admin feature tests"""
        print("🚀 Testing New Admin Dashboard Features")
        print("📍 Testing against:", self.base_url)
        print("=" * 80)
        
        # Setup admin authentication
        if not self.setup_admin_auth():
            print("❌ Failed to setup admin authentication")
            return False
        
        # Run detailed tests
        tests = [
            ("Admin Update User Subscription", self.test_admin_update_user_subscription_detailed),
            ("Admin Revenue by Period", self.test_admin_revenue_by_period_detailed),
            ("Full Admin Flow", self.test_full_admin_flow_detailed)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    print(f"\n✅ {test_name} - PASSED")
                    passed += 1
                else:
                    print(f"\n❌ {test_name} - FAILED")
            except Exception as e:
                print(f"\n❌ {test_name} - FAILED: {str(e)}")
        
        print("\n" + "=" * 80)
        print(f"📊 Test Summary: {passed}/{total} tests passed")
        success_rate = (passed / total) * 100 if total > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if passed == total:
            print("🎉 All new admin dashboard features are working correctly!")
            return True
        else:
            print("⚠️ Some tests failed - check details above")
            return False

def main():
    tester = NewAdminFeaturesTester()
    success = tester.run_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())