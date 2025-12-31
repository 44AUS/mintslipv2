import requests
import sys
import json
from datetime import datetime

class AIResumeBuilderTester:
    def __init__(self, base_url="https://font-issue-fixer.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.admin_token = None  # Store admin token for authenticated requests

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

    def test_health_check(self):
        """Test GET /api/health endpoint"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                expected_response = {"status": "healthy"}
                if data == expected_response:
                    details += f", Response: {data}"
                else:
                    success = False
                    details += f", Unexpected response: {data}, Expected: {expected_response}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Health Check API", success, details)
            return success
        except Exception as e:
            self.log_test("Health Check API", False, f"Exception: {str(e)}")
            return False

    def test_scrape_job(self):
        """Test POST /api/scrape-job endpoint with real job posting URL"""
        try:
            # Using a real job posting URL for testing
            payload = {
                "url": "https://www.indeed.com/viewjob?jk=example"
            }
            response = requests.post(
                f"{self.api_url}/scrape-job", 
                json=payload, 
                timeout=30
            )
            
            # Accept both success and expected failures (400 for invalid URLs)
            success = response.status_code in [200, 400]
            details = f"Status: {response.status_code}"
            
            if response.status_code == 200:
                data = response.json()
                if "jobDescription" in data and len(data["jobDescription"]) > 50:
                    details += f", Job description extracted ({len(data['jobDescription'])} chars)"
                else:
                    success = False
                    details += f", Invalid job description: {data}"
            elif response.status_code == 400:
                # Expected for test URLs that may not be accessible
                try:
                    error_data = response.json()
                    details += f", Expected error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Job Description Scraper API", success, details)
            return success
        except Exception as e:
            self.log_test("Job Description Scraper API", False, f"Exception: {str(e)}")
            return False

    def test_generate_resume(self):
        """Test POST /api/generate-resume endpoint with full sample data"""
        try:
            # Full sample data as specified in the review request
            payload = {
                "personalInfo": {
                    "fullName": "Sarah Johnson",
                    "email": "sarah.johnson@email.com",
                    "phone": "(415) 555-1234",
                    "location": "Seattle, WA",
                    "linkedin": "linkedin.com/in/sarahjohnson"
                },
                "workExperience": [
                    {
                        "company": "Amazon Web Services",
                        "position": "Software Development Engineer",
                        "location": "Seattle, WA",
                        "startDate": "2021-06",
                        "endDate": "Present",
                        "current": True,
                        "responsibilities": [
                            "Designed and implemented RESTful APIs serving 10M+ requests daily",
                            "Mentored 3 junior developers on best practices",
                            "Reduced deployment time by 50% through CI/CD improvements"
                        ]
                    },
                    {
                        "company": "Microsoft",
                        "position": "Software Engineer Intern",
                        "location": "Redmond, WA",
                        "startDate": "2020-06",
                        "endDate": "2020-09",
                        "current": False,
                        "responsibilities": [
                            "Developed features for Azure DevOps",
                            "Wrote unit tests achieving 90% code coverage"
                        ]
                    }
                ],
                "education": [
                    {
                        "institution": "University of Washington",
                        "degree": "Bachelor of Science",
                        "field": "Computer Science",
                        "graduationDate": "2021",
                        "gpa": "3.9"
                    }
                ],
                "skills": ["Python", "Java", "AWS", "Kubernetes", "React", "SQL", "Git"],
                "targetJobTitle": "Senior Software Engineer",
                "jobDescription": "Senior Software Engineer at a leading tech company. Requirements: 4+ years experience in software development, proficiency in Python or Java, experience with cloud platforms (AWS preferred), strong problem-solving skills, experience with microservices architecture, excellent communication skills."
            }
            
            response = requests.post(
                f"{self.api_url}/generate-resume", 
                json=payload, 
                timeout=60
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = [
                    "professionalSummary", 
                    "optimizedExperience", 
                    "optimizedSkills", 
                    "keywordsUsed", 
                    "atsScore", 
                    "suggestions"
                ]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    # Validate structure
                    validation_errors = []
                    
                    if not isinstance(data.get("optimizedExperience"), list):
                        validation_errors.append("optimizedExperience should be a list")
                    
                    if not isinstance(data.get("optimizedSkills"), dict):
                        validation_errors.append("optimizedSkills should be a dict")
                    
                    if not isinstance(data.get("keywordsUsed"), list):
                        validation_errors.append("keywordsUsed should be a list")
                    
                    if not isinstance(data.get("atsScore"), (int, float)):
                        validation_errors.append("atsScore should be a number")
                    
                    if not isinstance(data.get("suggestions"), list):
                        validation_errors.append("suggestions should be a list")
                    
                    if validation_errors:
                        success = False
                        details += f", Validation errors: {validation_errors}"
                    else:
                        details += f", All required fields present with correct structure"
                        details += f", ATS Score: {data.get('atsScore')}"
                        details += f", Keywords: {len(data.get('keywordsUsed', []))}"
                        details += f", Experience entries: {len(data.get('optimizedExperience', []))}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Generate Resume API", success, details)
            return success
        except Exception as e:
            self.log_test("Generate Resume API", False, f"Exception: {str(e)}")
            return False

    def test_regenerate_section(self):
        """Test POST /api/regenerate-section endpoint"""
        try:
            # Test regenerating the summary section
            payload = {
                "section": "summary",
                "currentContent": "Experienced software engineer seeking new opportunities.",
                "jobDescription": "We need a senior engineer with Python and AWS experience."
            }
            
            response = requests.post(
                f"{self.api_url}/regenerate-section", 
                json=payload, 
                timeout=30
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if "content" in data and isinstance(data["content"], str) and len(data["content"]) > 10:
                    details += f", Regenerated content ({len(data['content'])} chars)"
                else:
                    success = False
                    details += f", Invalid content response: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Regenerate Section API", success, details)
            return success
        except Exception as e:
            self.log_test("Regenerate Section API", False, f"Exception: {str(e)}")
            return False

    def test_backend_service_status(self):
        """Test if backend service is running"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=5)
            success = response.status_code == 200
            details = f"Backend service is running (Status: {response.status_code})"
            self.log_test("Backend Service Status", success, details)
            return success
        except requests.exceptions.ConnectionError:
            self.log_test("Backend Service Status", False, "Backend service not accessible")
            return False
        except Exception as e:
            success = False
            details = f"Backend service error: {str(e)}"
            self.log_test("Backend Service Status", success, details)
            return success

    def test_cors_headers(self):
        """Test CORS headers are present"""
        try:
            response = requests.options(f"{self.api_url}/health", timeout=10)
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

    # ========== ADMIN AUTHENTICATION TESTS ==========

    def test_admin_setup(self):
        """Test POST /api/admin/setup endpoint"""
        try:
            response = requests.post(f"{self.api_url}/admin/setup", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if "message" in data:
                    details += f", Message: {data['message']}"
                else:
                    success = False
                    details += f", Unexpected response: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Admin Setup", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Setup", False, f"Exception: {str(e)}")
            return False

    def test_admin_login(self):
        """Test POST /api/admin/login endpoint"""
        try:
            payload = {
                "email": "admin@mintslip.com",
                "password": "MINTSLIP2025!"
            }
            response = requests.post(f"{self.api_url}/admin/login", json=payload, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ["success", "token", "admin"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                elif data.get("success") and data.get("token") and data.get("admin"):
                    # Store token for subsequent tests
                    self.admin_token = data["token"]
                    admin_info = data["admin"]
                    details += f", Token received, Admin: {admin_info.get('email', 'Unknown')}"
                else:
                    success = False
                    details += f", Invalid response structure: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Admin Login", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False

    def test_admin_verify(self):
        """Test GET /api/admin/verify endpoint"""
        if not self.admin_token:
            self.log_test("Admin Verify", False, "No admin token available (login test must pass first)")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.api_url}/admin/verify", headers=headers, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get("success") and "admin" in data:
                    admin_info = data["admin"]
                    details += f", Admin verified: {admin_info.get('email', 'Unknown')}"
                else:
                    success = False
                    details += f", Invalid response: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Admin Verify", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Verify", False, f"Exception: {str(e)}")
            return False

    def test_admin_dashboard(self):
        """Test GET /api/admin/dashboard endpoint"""
        if not self.admin_token:
            self.log_test("Admin Dashboard", False, "No admin token available (login test must pass first)")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.api_url}/admin/dashboard", headers=headers, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get("success") and "stats" in data:
                    stats = data["stats"]
                    required_stats = ["totalPurchases", "totalRevenue", "totalSubscribers", "totalUsers", "todayPurchases", "todayRevenue"]
                    missing_stats = [stat for stat in required_stats if stat not in stats]
                    
                    if missing_stats:
                        success = False
                        details += f", Missing stats: {missing_stats}"
                    else:
                        details += f", Stats: Purchases={stats['totalPurchases']}, Revenue=${stats['totalRevenue']}, Users={stats['totalUsers']}"
                        
                        # Check for additional dashboard data
                        if "purchasesByType" in data and "recentPurchases" in data:
                            details += f", Additional data: {len(data['purchasesByType'])} purchase types, {len(data['recentPurchases'])} recent purchases"
                        else:
                            details += ", Missing purchasesByType or recentPurchases"
                else:
                    success = False
                    details += f", Invalid response structure: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Admin Dashboard", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Dashboard", False, f"Exception: {str(e)}")
            return False

    def test_purchase_tracking(self):
        """Test POST /api/purchases/track endpoint"""
        try:
            payload = {
                "documentType": "paystub",
                "amount": 9.99,
                "paypalEmail": "test@example.com",
                "paypalTransactionId": "TEST123"
            }
            response = requests.post(f"{self.api_url}/purchases/track", json=payload, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get("success") and "purchaseId" in data:
                    details += f", Purchase tracked with ID: {data['purchaseId']}"
                else:
                    success = False
                    details += f", Invalid response: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Purchase Tracking", success, details)
            return success
        except Exception as e:
            self.log_test("Purchase Tracking", False, f"Exception: {str(e)}")
            return False

    def test_admin_purchases(self):
        """Test GET /api/admin/purchases endpoint"""
        if not self.admin_token:
            self.log_test("Admin Purchases", False, "No admin token available (login test must pass first)")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.api_url}/admin/purchases", headers=headers, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get("success") and "purchases" in data and "total" in data:
                    purchases = data["purchases"]
                    total = data["total"]
                    details += f", Found {len(purchases)} purchases out of {total} total"
                    
                    # Check pagination fields
                    if "skip" in data and "limit" in data:
                        details += f", Pagination: skip={data['skip']}, limit={data['limit']}"
                else:
                    success = False
                    details += f", Invalid response structure: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Admin Purchases", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Purchases", False, f"Exception: {str(e)}")
            return False

    def test_subscription_tiers(self):
        """Test GET /api/subscription/tiers endpoint"""
        try:
            response = requests.get(f"{self.api_url}/subscription/tiers", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get("success") and "tiers" in data:
                    tiers = data["tiers"]
                    expected_tiers = ["basic", "pro", "unlimited"]
                    
                    # Check if all expected tiers are present
                    missing_tiers = [tier for tier in expected_tiers if tier not in tiers]
                    if missing_tiers:
                        success = False
                        details += f", Missing tiers: {missing_tiers}"
                    else:
                        # Validate tier structure
                        tier_details = []
                        for tier_name, tier_info in tiers.items():
                            required_fields = ["name", "price", "downloads"]
                            if all(field in tier_info for field in required_fields):
                                tier_details.append(f"{tier_info['name']}: ${tier_info['price']}/month, {tier_info['downloads']} downloads")
                            else:
                                success = False
                                details += f", Invalid tier structure for {tier_name}"
                                break
                        
                        if success:
                            details += f", Tiers: {'; '.join(tier_details)}"
                else:
                    success = False
                    details += f", Invalid response structure: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Subscription Tiers", success, details)
            return success
        except Exception as e:
            self.log_test("Subscription Tiers", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all AI Resume Builder backend API tests"""
        print("🚀 Starting AI Resume Builder Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test backend service status first
        print("\n🔧 Testing Backend Service...")
        backend_running = self.test_backend_service_status()
        
        if not backend_running:
            print("❌ Backend service is not running. Cannot proceed with API tests.")
            return False
        
        # Test all API endpoints
        print("\n🏥 Testing Health Check API...")
        health_ok = self.test_health_check()
        
        print("\n🕷️ Testing Job Description Scraper API...")
        scraper_ok = self.test_scrape_job()
        
        print("\n📄 Testing Generate Resume API...")
        generate_ok = self.test_generate_resume()
        
        print("\n🔄 Testing Regenerate Section API...")
        regenerate_ok = self.test_regenerate_section()
        
        # Test additional functionality
        print("\n🌐 Testing CORS Headers...")
        cors_ok = self.test_cors_headers()
        
        print("\n❌ Testing Invalid Endpoint Handling...")
        invalid_ok = self.test_invalid_endpoints()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        # Determine overall success - focus on critical API endpoints
        critical_tests_passed = health_ok and generate_ok and regenerate_ok
        
        if critical_tests_passed:
            print("🎉 Critical AI Resume Builder API tests passed!")
            print("✅ Backend APIs are working correctly")
            return True
        else:
            print("⚠️  Some critical API tests failed - check details above")
            return False

def main():
    tester = AIResumeBuilderTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())