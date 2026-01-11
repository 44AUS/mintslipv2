#!/usr/bin/env python3
"""
Focused Stripe Integration Test for MintSlip
Tests only the Stripe payment endpoints as requested in the review.
"""

import requests
import sys
import json
from datetime import datetime

class StripeIntegrationTester:
    def __init__(self, base_url="https://bank-checkout-debug.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.stripe_test_token = None
        self.stripe_session_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_stripe_config(self):
        """Test GET /api/stripe/config endpoint"""
        try:
            response = requests.get(f"{self.api_url}/stripe/config", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if "publishableKey" in data:
                    pub_key = data["publishableKey"]
                    if pub_key and pub_key.startswith("pk_test_"):
                        details += f", Valid publishable key: {pub_key[:20]}..."
                    else:
                        success = False
                        details += f", Invalid publishable key: {pub_key}"
                else:
                    success = False
                    details += f", Missing publishableKey in response: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Stripe Config API", success, details)
            return success
        except Exception as e:
            self.log_test("Stripe Config API", False, f"Exception: {str(e)}")
            return False

    def test_stripe_one_time_checkout(self):
        """Test POST /api/stripe/create-one-time-checkout endpoint"""
        try:
            payload = {
                "amount": 9.99,
                "documentType": "paystub",
                "template": "template-a"
            }
            response = requests.post(f"{self.api_url}/stripe/create-one-time-checkout", json=payload, timeout=15)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ["success", "sessionId", "url"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                elif data.get("success") and data.get("sessionId") and data.get("url"):
                    session_id = data["sessionId"]
                    checkout_url = data["url"]
                    
                    # Validate session ID format
                    if session_id.startswith("cs_test_"):
                        details += f", Valid session ID: {session_id[:20]}..."
                    else:
                        success = False
                        details += f", Invalid session ID format: {session_id}"
                    
                    # Validate checkout URL
                    if "checkout.stripe.com" in checkout_url:
                        details += f", Valid checkout URL"
                    else:
                        success = False
                        details += f", Invalid checkout URL: {checkout_url}"
                else:
                    success = False
                    details += f", Invalid response structure: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Stripe One-Time Checkout API", success, details)
            return success
        except Exception as e:
            self.log_test("Stripe One-Time Checkout API", False, f"Exception: {str(e)}")
            return False

    def test_user_auth_for_stripe(self):
        """Test user authentication endpoints needed for Stripe subscription testing"""
        try:
            # Test user registration
            import time
            timestamp = int(time.time())
            register_payload = {
                "name": "Stripe Test User",
                "email": f"stripetest{timestamp}@test.com", 
                "password": "test123"
            }
            
            register_response = requests.post(f"{self.api_url}/user/signup", json=register_payload, timeout=10)
            
            # Accept both success and "already exists" scenarios
            if register_response.status_code == 200:
                register_data = register_response.json()
                if register_data.get("success") and register_data.get("token"):
                    self.stripe_test_token = register_data["token"]
                    details = f"User registered successfully, token received"
                else:
                    self.log_test("User Auth for Stripe", False, f"Invalid registration response: {register_data}")
                    return False
            else:
                # Try login with existing test user
                login_payload = {
                    "email": "stripetest@test.com",
                    "password": "test123"
                }
                login_response = requests.post(f"{self.api_url}/user/login", json=login_payload, timeout=10)
                
                if login_response.status_code == 200:
                    login_data = login_response.json()
                    if login_data.get("success") and login_data.get("token"):
                        self.stripe_test_token = login_data["token"]
                        details = f"Existing user login successful, token received"
                    else:
                        self.log_test("User Auth for Stripe", False, f"Invalid login response: {login_data}")
                        return False
                else:
                    self.log_test("User Auth for Stripe", False, f"Both registration and login failed. Register: {register_response.status_code}, Login: {login_response.status_code}")
                    return False
            
            self.log_test("User Auth for Stripe", True, details)
            return True
        except Exception as e:
            self.log_test("User Auth for Stripe", False, f"Exception: {str(e)}")
            return False

    def test_stripe_subscription_checkout(self):
        """Test POST /api/stripe/create-checkout-session endpoint (requires authentication)"""
        if not self.stripe_test_token:
            self.log_test("Stripe Subscription Checkout API", False, "No user token available (user auth test must pass first)")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.stripe_test_token}"}
            payload = {"tier": "starter"}
            
            response = requests.post(f"{self.api_url}/stripe/create-checkout-session", json=payload, headers=headers, timeout=15)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ["success", "sessionId", "url"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                elif data.get("success") and data.get("sessionId") and data.get("url"):
                    session_id = data["sessionId"]
                    checkout_url = data["url"]
                    
                    # Store session ID for status testing
                    self.stripe_session_id = session_id
                    
                    # Validate session ID format
                    if session_id.startswith("cs_test_"):
                        details += f", Valid session ID: {session_id[:20]}..."
                    else:
                        success = False
                        details += f", Invalid session ID format: {session_id}"
                    
                    # Validate checkout URL
                    if "checkout.stripe.com" in checkout_url:
                        details += f", Valid checkout URL"
                    else:
                        success = False
                        details += f", Invalid checkout URL: {checkout_url}"
                else:
                    success = False
                    details += f", Invalid response structure: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Stripe Subscription Checkout API", success, details)
            return success
        except Exception as e:
            self.log_test("Stripe Subscription Checkout API", False, f"Exception: {str(e)}")
            return False

    def test_stripe_checkout_status(self):
        """Test GET /api/stripe/checkout-status/{session_id} endpoint"""
        if not self.stripe_session_id:
            self.log_test("Stripe Checkout Status API", False, "No session ID available (subscription checkout test must pass first)")
            return False
        
        try:
            response = requests.get(f"{self.api_url}/stripe/checkout-status/{self.stripe_session_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ["status", "payment_status"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    session_status = data.get("status")
                    payment_status = data.get("payment_status")
                    amount_total = data.get("amount_total")
                    currency = data.get("currency")
                    
                    details += f", Session status: {session_status}, Payment status: {payment_status}"
                    
                    if amount_total and currency:
                        details += f", Amount: {amount_total} {currency}"
                    
                    # Validate status values
                    valid_session_statuses = ["open", "complete", "expired"]
                    valid_payment_statuses = ["paid", "unpaid", "no_payment_required"]
                    
                    if session_status not in valid_session_statuses:
                        success = False
                        details += f", Invalid session status: {session_status}"
                    
                    if payment_status not in valid_payment_statuses:
                        success = False
                        details += f", Invalid payment status: {payment_status}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Stripe Checkout Status API", success, details)
            return success
        except Exception as e:
            self.log_test("Stripe Checkout Status API", False, f"Exception: {str(e)}")
            return False

    def run_stripe_tests(self):
        """Run all Stripe integration tests"""
        print("🚀 Starting MintSlip Stripe Integration Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        print("\n💳 Testing Stripe Payment Integration...")
        
        # Test 1: Stripe Config
        print("\n1️⃣ Testing Stripe Config Endpoint...")
        config_ok = self.test_stripe_config()
        
        # Test 2: One-Time Checkout
        print("\n2️⃣ Testing One-Time Checkout Endpoint...")
        one_time_ok = self.test_stripe_one_time_checkout()
        
        # Test 3: User Authentication (needed for subscription)
        print("\n3️⃣ Testing User Authentication...")
        auth_ok = self.test_user_auth_for_stripe()
        
        # Test 4: Subscription Checkout (requires auth)
        print("\n4️⃣ Testing Subscription Checkout Endpoint...")
        subscription_ok = self.test_stripe_subscription_checkout()
        
        # Test 5: Checkout Status
        print("\n5️⃣ Testing Checkout Status Endpoint...")
        status_ok = self.test_stripe_checkout_status()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Stripe Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        all_passed = config_ok and one_time_ok and auth_ok and subscription_ok and status_ok
        
        if all_passed:
            print("\n🎉 ALL STRIPE INTEGRATION TESTS PASSED!")
            print("✅ Stripe Config: Returns valid publishable key")
            print("✅ One-Time Checkout: Creates valid payment sessions")
            print("✅ User Authentication: Working for subscription flow")
            print("✅ Subscription Checkout: Creates valid subscription sessions")
            print("✅ Checkout Status: Returns proper session information")
            print("\n💡 The Stripe payment integration is fully functional!")
            return True
        else:
            print("\n⚠️ Some Stripe integration tests failed:")
            failed_tests = []
            if not config_ok:
                failed_tests.append("Stripe Config")
            if not one_time_ok:
                failed_tests.append("One-Time Checkout")
            if not auth_ok:
                failed_tests.append("User Authentication")
            if not subscription_ok:
                failed_tests.append("Subscription Checkout")
            if not status_ok:
                failed_tests.append("Checkout Status")
            
            print(f"❌ Failed: {', '.join(failed_tests)}")
            return False

if __name__ == "__main__":
    tester = StripeIntegrationTester()
    success = tester.run_stripe_tests()
    sys.exit(0 if success else 1)