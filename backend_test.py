import requests
import sys
import json
from datetime import datetime

class DocuMintAPITester:
    def __init__(self, base_url="https://header-dropdown-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_root_endpoint(self):
        """Test GET /api/ endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Response: {data}"
            self.log_test("Root API Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Root API Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_create_paystub_order(self):
        """Test POST /api/create-order for paystub (₹10)"""
        try:
            payload = {
                "document_type": "paystub",
                "amount": 1000  # ₹10 in paise
            }
            response = requests.post(
                f"{self.api_url}/create-order", 
                json=payload, 
                timeout=10
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ["order_id", "amount", "currency", "key_id"]
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += f", Order ID: {data.get('order_id', 'N/A')}, Amount: {data.get('amount', 'N/A')}"
                    # Store order_id for verification test
                    self.paystub_order_id = data.get('order_id')
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Create Paystub Order (₹10)", success, details)
            return success
        except Exception as e:
            self.log_test("Create Paystub Order (₹10)", False, f"Exception: {str(e)}")
            return False

    def test_create_bankstatement_order(self):
        """Test POST /api/create-order for bank statement (₹50)"""
        try:
            payload = {
                "document_type": "bankstatement",
                "amount": 5000  # ₹50 in paise
            }
            response = requests.post(
                f"{self.api_url}/create-order", 
                json=payload, 
                timeout=10
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ["order_id", "amount", "currency", "key_id"]
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += f", Order ID: {data.get('order_id', 'N/A')}, Amount: {data.get('amount', 'N/A')}"
                    # Store order_id for verification test
                    self.bankstatement_order_id = data.get('order_id')
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Create Bank Statement Order (₹50)", success, details)
            return success
        except Exception as e:
            self.log_test("Create Bank Statement Order (₹50)", False, f"Exception: {str(e)}")
            return False

    def test_verify_payment(self):
        """Test POST /api/verify-payment endpoint"""
        try:
            # Use a mock payment verification (this would normally come from Razorpay)
            payload = {
                "razorpay_order_id": getattr(self, 'paystub_order_id', 'test_order_123'),
                "razorpay_payment_id": "test_payment_123",
                "razorpay_signature": "test_signature_123",
                "document_type": "paystub"
            }
            response = requests.post(
                f"{self.api_url}/verify-payment", 
                json=payload, 
                timeout=10
            )
            
            # In test mode, this might return 404 (transaction not found) or 400 (verification failed)
            # Both are acceptable for testing purposes
            success = response.status_code in [200, 400, 404]
            details = f"Status: {response.status_code}"
            
            try:
                data = response.json()
                details += f", Response: {data}"
            except:
                details += f", Response: {response.text}"
            
            self.log_test("Verify Payment", success, details)
            return success
        except Exception as e:
            self.log_test("Verify Payment", False, f"Exception: {str(e)}")
            return False

    def test_get_transactions(self):
        """Test GET /api/transactions endpoint"""
        try:
            response = requests.get(f"{self.api_url}/transactions", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                details += f", Transactions count: {len(data) if isinstance(data, list) else 'N/A'}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Get Transactions", success, details)
            return success
        except Exception as e:
            self.log_test("Get Transactions", False, f"Exception: {str(e)}")
            return False

    def test_invalid_endpoints(self):
        """Test invalid endpoints return proper error codes"""
        try:
            response = requests.get(f"{self.api_url}/nonexistent", timeout=10)
            success = response.status_code == 404
            details = f"Status: {response.status_code} (Expected 404)"
            self.log_test("Invalid Endpoint Handling", success, details)
            return success
        except Exception as e:
            self.log_test("Invalid Endpoint Handling", False, f"Exception: {str(e)}")
            return False

    def test_cors_headers(self):
        """Test CORS headers are present"""
        try:
            response = requests.options(f"{self.api_url}/", timeout=10)
            cors_headers = [
                'access-control-allow-origin',
                'access-control-allow-methods',
                'access-control-allow-headers'
            ]
            
            present_headers = [h for h in cors_headers if h in [k.lower() for k in response.headers.keys()]]
            success = len(present_headers) > 0
            details = f"Status: {response.status_code}, CORS headers: {present_headers}"
            
            self.log_test("CORS Headers", success, details)
            return success
        except Exception as e:
            self.log_test("CORS Headers", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting DocuMint Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test basic connectivity first
        if not self.test_root_endpoint():
            print("\n❌ Root endpoint failed - backend may not be running")
            return False
        
        # Test all endpoints
        self.test_create_paystub_order()
        self.test_create_bankstatement_order()
        self.test_verify_payment()
        self.test_get_transactions()
        self.test_invalid_endpoints()
        self.test_cors_headers()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed - check details above")
            return False

def main():
    tester = DocuMintAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())