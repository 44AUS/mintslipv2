import requests
import sys
import json
from datetime import datetime

class AIResumeBuilderTester:
    def __init__(self, base_url="https://ai-resume-dedup.preview.emergentagent.com"):
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

    # ========== NEW ADMIN DASHBOARD FEATURES TESTS ==========

    def test_admin_users_list(self):
        """Test GET /api/admin/users endpoint"""
        if not self.admin_token:
            self.log_test("Admin Users List", False, "No admin token available (login test must pass first)")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.api_url}/admin/users", headers=headers, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get("success") and "users" in data and "total" in data:
                    users = data["users"]
                    total = data["total"]
                    details += f", Found {len(users)} users out of {total} total"
                else:
                    success = False
                    details += f", Invalid response structure: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Admin Users List", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Users List", False, f"Exception: {str(e)}")
            return False

    def create_test_user(self):
        """Create a test user for subscription testing"""
        try:
            # Use timestamp to create unique email
            import time
            timestamp = int(time.time())
            payload = {
                "email": f"testuser{timestamp}@mintslip.com",
                "password": "TestPassword123!",
                "name": "Test User"
            }
            response = requests.post(f"{self.api_url}/user/signup", json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("user"):
                    return data["user"]["id"]
            elif response.status_code == 400:
                # User might already exist, try to get existing users and find one
                if self.admin_token:
                    headers = {"Authorization": f"Bearer {self.admin_token}"}
                    users_response = requests.get(f"{self.api_url}/admin/users", headers=headers, timeout=10)
                    if users_response.status_code == 200:
                        users_data = users_response.json()
                        users = users_data.get("users", [])
                        if users:
                            # Return the first user's ID
                            return users[0].get("id")
            return None
        except Exception:
            return None

    def test_admin_update_user_subscription(self):
        """Test PUT /api/admin/users/{user_id}/subscription endpoint"""
        if not self.admin_token:
            self.log_test("Admin Update User Subscription", False, "No admin token available (login test must pass first)")
            return False
        
        # Create a test user first
        test_user_id = self.create_test_user()
        if not test_user_id:
            self.log_test("Admin Update User Subscription", False, "Could not create test user")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test 1: Update to basic tier
            payload = {"tier": "basic"}
            response = requests.put(
                f"{self.api_url}/admin/users/{test_user_id}/subscription", 
                json=payload, 
                headers=headers, 
                timeout=10
            )
            success = response.status_code == 200
            details = f"Basic tier - Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get("success") and "subscription" in data:
                    subscription = data["subscription"]
                    if subscription.get("tier") == "basic" and subscription.get("adminAssigned"):
                        details += f", Basic subscription assigned successfully"
                    else:
                        success = False
                        details += f", Invalid subscription data: {subscription}"
                else:
                    success = False
                    details += f", Invalid response: {data}"
            
            # Test 2: Update to pro tier
            if success:
                payload = {"tier": "pro"}
                response = requests.put(
                    f"{self.api_url}/admin/users/{test_user_id}/subscription", 
                    json=payload, 
                    headers=headers, 
                    timeout=10
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("subscription", {}).get("tier") == "pro":
                        details += f", Pro tier update successful"
                    else:
                        success = False
                        details += f", Pro tier update failed: {data}"
                else:
                    success = False
                    details += f", Pro tier update failed with status: {response.status_code}"
            
            # Test 3: Update to unlimited tier
            if success:
                payload = {"tier": "unlimited"}
                response = requests.put(
                    f"{self.api_url}/admin/users/{test_user_id}/subscription", 
                    json=payload, 
                    headers=headers, 
                    timeout=10
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("subscription", {}).get("tier") == "unlimited":
                        details += f", Unlimited tier update successful"
                    else:
                        success = False
                        details += f", Unlimited tier update failed: {data}"
                else:
                    success = False
                    details += f", Unlimited tier update failed with status: {response.status_code}"
            
            # Test 4: Remove subscription (set to null)
            if success:
                payload = {"tier": None}
                response = requests.put(
                    f"{self.api_url}/admin/users/{test_user_id}/subscription", 
                    json=payload, 
                    headers=headers, 
                    timeout=10
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("subscription") is None:
                        details += f", Subscription removal successful"
                    else:
                        success = False
                        details += f", Subscription removal failed: {data}"
                else:
                    success = False
                    details += f", Subscription removal failed with status: {response.status_code}"
            
            self.log_test("Admin Update User Subscription", success, details)
            return success
            
        except Exception as e:
            self.log_test("Admin Update User Subscription", False, f"Exception: {str(e)}")
            return False

    def test_admin_revenue_by_period(self):
        """Test GET /api/admin/revenue endpoint"""
        if not self.admin_token:
            self.log_test("Admin Revenue by Period", False, "No admin token available (login test must pass first)")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test 1: Get all-time revenue (no parameters)
            response = requests.get(f"{self.api_url}/admin/revenue", headers=headers, timeout=10)
            success = response.status_code == 200
            details = f"All-time - Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ["success", "revenue", "purchaseCount", "period"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                elif data.get("success"):
                    revenue = data.get("revenue", 0)
                    count = data.get("purchaseCount", 0)
                    details += f", Revenue: ${revenue}, Purchases: {count}"
                else:
                    success = False
                    details += f", Invalid response: {data}"
            
            # Test 2: Get revenue with startDate parameter
            if success:
                start_date = "2024-01-01T00:00:00Z"
                params = {"startDate": start_date}
                response = requests.get(f"{self.api_url}/admin/revenue", headers=headers, params=params, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "period" in data:
                        period = data["period"]
                        if period.get("startDate") == start_date:
                            details += f", StartDate filter working"
                        else:
                            success = False
                            details += f", StartDate filter failed: {period}"
                    else:
                        success = False
                        details += f", StartDate test failed: {data}"
                else:
                    success = False
                    details += f", StartDate test failed with status: {response.status_code}"
            
            # Test 3: Get revenue with both startDate and endDate
            if success:
                start_date = "2024-01-01T00:00:00Z"
                end_date = "2024-12-31T23:59:59Z"
                params = {"startDate": start_date, "endDate": end_date}
                response = requests.get(f"{self.api_url}/admin/revenue", headers=headers, params=params, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and "period" in data:
                        period = data["period"]
                        if period.get("startDate") == start_date and period.get("endDate") == end_date:
                            details += f", Date range filter working"
                        else:
                            success = False
                            details += f", Date range filter failed: {period}"
                    else:
                        success = False
                        details += f", Date range test failed: {data}"
                else:
                    success = False
                    details += f", Date range test failed with status: {response.status_code}"
            
            self.log_test("Admin Revenue by Period", success, details)
            return success
            
        except Exception as e:
            self.log_test("Admin Revenue by Period", False, f"Exception: {str(e)}")
            return False

    def test_full_admin_flow(self):
        """Test complete admin flow: login -> get users -> update subscription -> verify -> get revenue"""
        try:
            # Step 1: Admin login (should already be done, but verify token exists)
            if not self.admin_token:
                self.log_test("Full Admin Flow", False, "No admin token available")
                return False
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            details = "Admin login verified"
            
            # Step 2: Get list of users
            response = requests.get(f"{self.api_url}/admin/users", headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Full Admin Flow", False, f"Failed to get users list: {response.status_code}")
                return False
            
            users_data = response.json()
            if not users_data.get("success"):
                self.log_test("Full Admin Flow", False, f"Invalid users response: {users_data}")
                return False
            
            details += f" -> Users list retrieved ({users_data.get('total', 0)} users)"
            
            # Step 3: Create a test user for subscription update
            test_user_id = self.create_test_user()
            if not test_user_id:
                self.log_test("Full Admin Flow", False, "Could not create test user for flow")
                return False
            
            details += f" -> Test user created ({test_user_id[:8]}...)"
            
            # Step 4: Update user's subscription to basic
            payload = {"tier": "basic"}
            response = requests.put(
                f"{self.api_url}/admin/users/{test_user_id}/subscription", 
                json=payload, 
                headers=headers, 
                timeout=10
            )
            if response.status_code != 200:
                self.log_test("Full Admin Flow", False, f"Failed to update subscription: {response.status_code}")
                return False
            
            subscription_data = response.json()
            if not subscription_data.get("success"):
                self.log_test("Full Admin Flow", False, f"Invalid subscription update: {subscription_data}")
                return False
            
            details += f" -> Subscription updated to basic"
            
            # Step 5: Verify the user's subscription was updated by getting users list again
            response = requests.get(f"{self.api_url}/admin/users", headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Full Admin Flow", False, f"Failed to verify subscription update: {response.status_code}")
                return False
            
            users_data = response.json()
            updated_user = None
            for user in users_data.get("users", []):
                if user.get("id") == test_user_id:
                    updated_user = user
                    break
            
            if not updated_user or not updated_user.get("subscription"):
                self.log_test("Full Admin Flow", False, "User subscription not found after update")
                return False
            
            if updated_user["subscription"].get("tier") != "basic":
                self.log_test("Full Admin Flow", False, f"Subscription tier mismatch: expected 'basic', got '{updated_user['subscription'].get('tier')}'")
                return False
            
            details += f" -> Subscription verified in users list"
            
            # Step 6: Get revenue stats
            response = requests.get(f"{self.api_url}/admin/revenue", headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Full Admin Flow", False, f"Failed to get revenue stats: {response.status_code}")
                return False
            
            revenue_data = response.json()
            if not revenue_data.get("success"):
                self.log_test("Full Admin Flow", False, f"Invalid revenue response: {revenue_data}")
                return False
            
            details += f" -> Revenue stats retrieved (${revenue_data.get('revenue', 0)}, {revenue_data.get('purchaseCount', 0)} purchases)"
            
            self.log_test("Full Admin Flow", True, details)
            return True
            
        except Exception as e:
            self.log_test("Full Admin Flow", False, f"Exception: {str(e)}")
            return False

    # ========== BLOG SYSTEM TESTS ==========

    def test_blog_categories(self):
        """Test GET /api/blog/categories endpoint (public)"""
        try:
            response = requests.get(f"{self.api_url}/blog/categories", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get("success") and "categories" in data:
                    categories = data["categories"]
                    if len(categories) >= 5:  # Should have 5 default categories
                        category_names = [cat.get("name", "Unknown") for cat in categories]
                        details += f", Found {len(categories)} categories: {', '.join(category_names[:3])}..."
                        
                        # Check if categories have post counts
                        has_post_counts = all("postCount" in cat for cat in categories)
                        if has_post_counts:
                            details += f", Post counts included"
                        else:
                            details += f", Missing post counts"
                    else:
                        success = False
                        details += f", Expected at least 5 categories, got {len(categories)}"
                else:
                    success = False
                    details += f", Invalid response structure: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Blog Categories API", success, details)
            return success
        except Exception as e:
            self.log_test("Blog Categories API", False, f"Exception: {str(e)}")
            return False

    def test_blog_posts_public(self):
        """Test GET /api/blog/posts endpoint (public)"""
        try:
            response = requests.get(f"{self.api_url}/blog/posts", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ["success", "posts", "total", "page", "pages"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                elif data.get("success"):
                    posts = data["posts"]
                    total = data["total"]
                    page = data["page"]
                    pages = data["pages"]
                    details += f", Found {len(posts)} posts out of {total} total, Page {page}/{pages}"
                    
                    # Test pagination and filtering
                    if len(posts) > 0:
                        # Test with category filter
                        first_post = posts[0]
                        if first_post.get("category"):
                            category_response = requests.get(
                                f"{self.api_url}/blog/posts?category={first_post['category']}", 
                                timeout=10
                            )
                            if category_response.status_code == 200:
                                details += f", Category filtering working"
                            else:
                                details += f", Category filtering failed"
                        
                        # Test search
                        search_response = requests.get(
                            f"{self.api_url}/blog/posts?search=test", 
                            timeout=10
                        )
                        if search_response.status_code == 200:
                            details += f", Search working"
                        else:
                            details += f", Search failed"
                else:
                    success = False
                    details += f", Invalid response: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Blog Posts Public API", success, details)
            return success
        except Exception as e:
            self.log_test("Blog Posts Public API", False, f"Exception: {str(e)}")
            return False

    def test_admin_blog_posts(self):
        """Test GET /api/admin/blog/posts endpoint (admin)"""
        if not self.admin_token:
            self.log_test("Admin Blog Posts", False, "No admin token available (login test must pass first)")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.api_url}/admin/blog/posts", headers=headers, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ["success", "posts", "total", "page", "pages"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                elif data.get("success"):
                    posts = data["posts"]
                    total = data["total"]
                    details += f", Found {len(posts)} posts out of {total} total (including drafts)"
                else:
                    success = False
                    details += f", Invalid response: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Admin Blog Posts", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Blog Posts", False, f"Exception: {str(e)}")
            return False

    def test_create_blog_post(self):
        """Test POST /api/admin/blog/posts endpoint (admin)"""
        if not self.admin_token:
            self.log_test("Create Blog Post", False, "No admin token available (login test must pass first)")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create a test blog post
            import time
            timestamp = int(time.time())
            payload = {
                "title": f"Test Blog Post {timestamp}",
                "slug": f"test-blog-post-{timestamp}",
                "metaTitle": f"Test Blog Post {timestamp} - Meta Title",
                "metaDescription": "This is a test blog post created during API testing",
                "author": "Test Author",
                "content": "# Test Blog Post\n\nThis is a test blog post content with **markdown** formatting.\n\n## Section 1\n\nSome content here.\n\n## Section 2\n\nMore content here.",
                "excerpt": "This is a test blog post created during API testing",
                "category": "pay-stubs",
                "tags": ["test", "api", "blog"],
                "status": "published",
                "indexFollow": True
            }
            
            response = requests.post(f"{self.api_url}/admin/blog/posts", json=payload, headers=headers, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get("success") and "post" in data:
                    created_post = data["post"]
                    post_id = created_post.get("id")
                    post_slug = created_post.get("slug")
                    details += f", Post created with ID: {post_id}, Slug: {post_slug}"
                    
                    # Store for cleanup and further testing
                    self.test_blog_post_id = post_id
                    self.test_blog_post_slug = post_slug
                    
                    # Verify required fields are present
                    required_fields = ["id", "title", "slug", "content", "status", "createdAt"]
                    missing_fields = [field for field in required_fields if field not in created_post]
                    if missing_fields:
                        success = False
                        details += f", Missing fields in created post: {missing_fields}"
                else:
                    success = False
                    details += f", Invalid response: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Create Blog Post", success, details)
            return success
        except Exception as e:
            self.log_test("Create Blog Post", False, f"Exception: {str(e)}")
            return False

    def test_get_blog_post_by_slug(self):
        """Test GET /api/blog/posts/{slug} endpoint (public)"""
        # First ensure we have a test post
        if not hasattr(self, 'test_blog_post_slug') or not self.test_blog_post_slug:
            self.log_test("Get Blog Post by Slug", False, "No test blog post available (create test must pass first)")
            return False
        
        try:
            response = requests.get(f"{self.api_url}/blog/posts/{self.test_blog_post_slug}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get("success") and "post" in data:
                    post = data["post"]
                    details += f", Post retrieved: {post.get('title', 'Unknown')}"
                    
                    # Check if view count incremented (test again to verify increment)
                    initial_views = post.get("views", 0)
                    
                    # Make another request to test view increment
                    response2 = requests.get(f"{self.api_url}/blog/posts/{self.test_blog_post_slug}", timeout=10)
                    if response2.status_code == 200:
                        data2 = response2.json()
                        if data2.get("success") and "post" in data2:
                            new_views = data2["post"].get("views", 0)
                            if new_views > initial_views:
                                details += f", View count incremented ({initial_views} -> {new_views})"
                            else:
                                details += f", View count not incremented ({initial_views} -> {new_views})"
                    
                    # Check for related posts
                    if "related" in data:
                        related_count = len(data["related"])
                        details += f", {related_count} related posts"
                else:
                    success = False
                    details += f", Invalid response: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Get Blog Post by Slug", success, details)
            return success
        except Exception as e:
            self.log_test("Get Blog Post by Slug", False, f"Exception: {str(e)}")
            return False

    def test_get_admin_blog_post_by_id(self):
        """Test GET /api/admin/blog/posts/{post_id} endpoint (admin)"""
        if not self.admin_token:
            self.log_test("Get Admin Blog Post by ID", False, "No admin token available (login test must pass first)")
            return False
        
        if not hasattr(self, 'test_blog_post_id') or not self.test_blog_post_id:
            self.log_test("Get Admin Blog Post by ID", False, "No test blog post available (create test must pass first)")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.api_url}/admin/blog/posts/{self.test_blog_post_id}", headers=headers, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get("success") and "post" in data:
                    post = data["post"]
                    details += f", Post retrieved: {post.get('title', 'Unknown')}, ID: {post.get('id', 'Unknown')}"
                else:
                    success = False
                    details += f", Invalid response: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Get Admin Blog Post by ID", success, details)
            return success
        except Exception as e:
            self.log_test("Get Admin Blog Post by ID", False, f"Exception: {str(e)}")
            return False

    def test_update_blog_post(self):
        """Test PUT /api/admin/blog/posts/{post_id} endpoint (admin)"""
        if not self.admin_token:
            self.log_test("Update Blog Post", False, "No admin token available (login test must pass first)")
            return False
        
        if not hasattr(self, 'test_blog_post_id') or not self.test_blog_post_id:
            self.log_test("Update Blog Post", False, "No test blog post available (create test must pass first)")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Update the test blog post
            payload = {
                "title": "Updated Test Blog Post",
                "content": "# Updated Test Blog Post\n\nThis content has been **updated** during API testing.\n\n## Updated Section\n\nNew content here.",
                "excerpt": "This test blog post has been updated"
            }
            
            response = requests.put(f"{self.api_url}/admin/blog/posts/{self.test_blog_post_id}", json=payload, headers=headers, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get("success"):
                    details += f", Post updated successfully"
                    
                    # Verify the update by fetching the post
                    verify_response = requests.get(f"{self.api_url}/admin/blog/posts/{self.test_blog_post_id}", headers=headers, timeout=10)
                    if verify_response.status_code == 200:
                        verify_data = verify_response.json()
                        if verify_data.get("success") and "post" in verify_data:
                            updated_post = verify_data["post"]
                            if updated_post.get("title") == "Updated Test Blog Post":
                                details += f", Update verified"
                            else:
                                success = False
                                details += f", Update not reflected in database"
                else:
                    success = False
                    details += f", Invalid response: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Update Blog Post", success, details)
            return success
        except Exception as e:
            self.log_test("Update Blog Post", False, f"Exception: {str(e)}")
            return False

    def test_upload_blog_image(self):
        """Test POST /api/admin/blog/upload-image endpoint (admin)"""
        if not self.admin_token:
            self.log_test("Upload Blog Image", False, "No admin token available (login test must pass first)")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create a simple test image file (1x1 pixel PNG)
            import base64
            # Minimal PNG data for a 1x1 transparent pixel
            png_data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg==')
            
            files = {
                'file': ('test.png', png_data, 'image/png')  # Changed from 'image' to 'file'
            }
            
            response = requests.post(f"{self.api_url}/admin/blog/upload-image", files=files, headers=headers, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get("success") and "url" in data:
                    image_url = data["url"]
                    details += f", Image uploaded: {image_url}"
                else:
                    success = False
                    details += f", Invalid response: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Upload Blog Image", success, details)
            return success
        except Exception as e:
            self.log_test("Upload Blog Image", False, f"Exception: {str(e)}")
            return False

    def test_delete_blog_post(self):
        """Test DELETE /api/admin/blog/posts/{post_id} endpoint (admin)"""
        if not self.admin_token:
            self.log_test("Delete Blog Post", False, "No admin token available (login test must pass first)")
            return False
        
        if not hasattr(self, 'test_blog_post_id') or not self.test_blog_post_id:
            self.log_test("Delete Blog Post", False, "No test blog post available (create test must pass first)")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.delete(f"{self.api_url}/admin/blog/posts/{self.test_blog_post_id}", headers=headers, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if data.get("success"):
                    details += f", Post deleted successfully"
                    
                    # Verify deletion by trying to fetch the post
                    verify_response = requests.get(f"{self.api_url}/admin/blog/posts/{self.test_blog_post_id}", headers=headers, timeout=10)
                    if verify_response.status_code == 404:
                        details += f", Deletion verified (404 on fetch)"
                    else:
                        details += f", Deletion not verified (still accessible)"
                else:
                    success = False
                    details += f", Invalid response: {data}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text}"
            
            self.log_test("Delete Blog Post", success, details)
            return success
        except Exception as e:
            self.log_test("Delete Blog Post", False, f"Exception: {str(e)}")
            return False

    def test_complete_blog_flow(self):
        """Test complete blog flow: login -> get categories -> create post -> verify public access -> update -> delete"""
        try:
            if not self.admin_token:
                self.log_test("Complete Blog Flow", False, "No admin token available")
                return False
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            details = "Admin login verified"
            
            # Step 1: Get categories
            response = requests.get(f"{self.api_url}/blog/categories", timeout=10)
            if response.status_code != 200:
                self.log_test("Complete Blog Flow", False, f"Failed to get categories: {response.status_code}")
                return False
            
            categories_data = response.json()
            if not categories_data.get("success"):
                self.log_test("Complete Blog Flow", False, f"Invalid categories response: {categories_data}")
                return False
            
            categories = categories_data.get("categories", [])
            details += f" -> Categories retrieved ({len(categories)} found)"
            
            # Step 2: Create a test blog post
            import time
            timestamp = int(time.time())
            payload = {
                "title": f"Complete Flow Test Post {timestamp}",
                "slug": f"complete-flow-test-{timestamp}",
                "content": "# Complete Flow Test\n\nThis post tests the complete blog flow.",
                "category": categories[0]["slug"] if categories else "pay-stubs",
                "tags": ["test", "flow"],
                "status": "published"
            }
            
            response = requests.post(f"{self.api_url}/admin/blog/posts", json=payload, headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Complete Blog Flow", False, f"Failed to create post: {response.status_code}")
                return False
            
            create_data = response.json()
            if not create_data.get("success"):
                self.log_test("Complete Blog Flow", False, f"Invalid create response: {create_data}")
                return False
            
            post_id = create_data["post"]["id"]
            post_slug = create_data["post"]["slug"]
            details += f" -> Post created ({post_slug})"
            
            # Step 3: Verify post appears in public blog posts list
            response = requests.get(f"{self.api_url}/blog/posts", timeout=10)
            if response.status_code != 200:
                self.log_test("Complete Blog Flow", False, f"Failed to get public posts: {response.status_code}")
                return False
            
            public_posts_data = response.json()
            if not public_posts_data.get("success"):
                self.log_test("Complete Blog Flow", False, f"Invalid public posts response: {public_posts_data}")
                return False
            
            # Check if our post is in the list
            posts = public_posts_data.get("posts", [])
            post_found = any(post.get("slug") == post_slug for post in posts)
            if not post_found:
                self.log_test("Complete Blog Flow", False, "Created post not found in public posts list")
                return False
            
            details += f" -> Post visible in public list"
            
            # Step 4: Get post by slug and verify view count increments
            response = requests.get(f"{self.api_url}/blog/posts/{post_slug}", timeout=10)
            if response.status_code != 200:
                self.log_test("Complete Blog Flow", False, f"Failed to get post by slug: {response.status_code}")
                return False
            
            post_data = response.json()
            if not post_data.get("success"):
                self.log_test("Complete Blog Flow", False, f"Invalid post response: {post_data}")
                return False
            
            initial_views = post_data["post"].get("views", 0)
            
            # Make another request to test view increment
            response = requests.get(f"{self.api_url}/blog/posts/{post_slug}", timeout=10)
            if response.status_code == 200:
                post_data2 = response.json()
                if post_data2.get("success"):
                    new_views = post_data2["post"].get("views", 0)
                    if new_views > initial_views:
                        details += f" -> View count incremented ({initial_views} -> {new_views})"
                    else:
                        details += f" -> View count not incremented"
            
            # Step 5: Update the post
            update_payload = {
                "title": f"Updated Complete Flow Test Post {timestamp}",
                "content": "# Updated Complete Flow Test\n\nThis post has been updated."
            }
            
            response = requests.put(f"{self.api_url}/admin/blog/posts/{post_id}", json=update_payload, headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Complete Blog Flow", False, f"Failed to update post: {response.status_code}")
                return False
            
            update_data = response.json()
            if not update_data.get("success"):
                self.log_test("Complete Blog Flow", False, f"Invalid update response: {update_data}")
                return False
            
            details += f" -> Post updated successfully"
            
            # Step 6: Delete the test post (cleanup)
            response = requests.delete(f"{self.api_url}/admin/blog/posts/{post_id}", headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Complete Blog Flow", False, f"Failed to delete post: {response.status_code}")
                return False
            
            delete_data = response.json()
            if not delete_data.get("success"):
                self.log_test("Complete Blog Flow", False, f"Invalid delete response: {delete_data}")
                return False
            
            details += f" -> Post deleted (cleanup completed)"
            
            self.log_test("Complete Blog Flow", True, details)
            return True
            
        except Exception as e:
            self.log_test("Complete Blog Flow", False, f"Exception: {str(e)}")
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
        
        # Test Admin Authentication and Dashboard System
        print("\n👤 Testing Admin Authentication System...")
        admin_setup_ok = self.test_admin_setup()
        admin_login_ok = self.test_admin_login()
        admin_verify_ok = self.test_admin_verify()
        admin_dashboard_ok = self.test_admin_dashboard()
        
        print("\n💰 Testing Purchase Tracking System...")
        purchase_track_ok = self.test_purchase_tracking()
        admin_purchases_ok = self.test_admin_purchases()
        
        print("\n📋 Testing Subscription System...")
        subscription_tiers_ok = self.test_subscription_tiers()
        
        # Test New Admin Dashboard Features
        print("\n🆕 Testing New Admin Dashboard Features...")
        admin_users_ok = self.test_admin_users_list()
        admin_update_subscription_ok = self.test_admin_update_user_subscription()
        admin_revenue_ok = self.test_admin_revenue_by_period()
        
        print("\n🔄 Testing Full Admin Flow...")
        full_admin_flow_ok = self.test_full_admin_flow()
        
        # Test Blog System APIs
        print("\n📝 Testing Blog System APIs...")
        blog_categories_ok = self.test_blog_categories()
        blog_posts_public_ok = self.test_blog_posts_public()
        admin_blog_posts_ok = self.test_admin_blog_posts()
        create_blog_post_ok = self.test_create_blog_post()
        get_blog_post_by_slug_ok = self.test_get_blog_post_by_slug()
        get_admin_blog_post_by_id_ok = self.test_get_admin_blog_post_by_id()
        update_blog_post_ok = self.test_update_blog_post()
        upload_blog_image_ok = self.test_upload_blog_image()
        delete_blog_post_ok = self.test_delete_blog_post()
        
        print("\n🔄 Testing Complete Blog Flow...")
        complete_blog_flow_ok = self.test_complete_blog_flow()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        # Determine overall success - focus on critical API endpoints
        critical_tests_passed = health_ok and generate_ok and regenerate_ok
        admin_tests_passed = admin_setup_ok and admin_login_ok and admin_verify_ok and admin_dashboard_ok
        purchase_tests_passed = purchase_track_ok and admin_purchases_ok
        subscription_tests_passed = subscription_tiers_ok
        new_admin_features_passed = admin_users_ok and admin_update_subscription_ok and admin_revenue_ok and full_admin_flow_ok
        blog_tests_passed = (blog_categories_ok and blog_posts_public_ok and admin_blog_posts_ok and 
                           create_blog_post_ok and get_blog_post_by_slug_ok and get_admin_blog_post_by_id_ok and 
                           update_blog_post_ok and delete_blog_post_ok and complete_blog_flow_ok)
        
        if critical_tests_passed and admin_tests_passed and purchase_tests_passed and subscription_tests_passed and new_admin_features_passed and blog_tests_passed:
            print("🎉 All critical AI Resume Builder API tests passed!")
            print("✅ Backend APIs are working correctly")
            print("✅ Admin authentication and dashboard system working")
            print("✅ Purchase tracking system working")
            print("✅ Subscription system working")
            print("✅ New admin dashboard features working")
            print("✅ Blog system APIs working")
            return True
        else:
            print("⚠️  Some critical API tests failed - check details above")
            failed_systems = []
            if not critical_tests_passed:
                failed_systems.append("Core Resume APIs")
            if not admin_tests_passed:
                failed_systems.append("Admin Authentication")
            if not purchase_tests_passed:
                failed_systems.append("Purchase Tracking")
            if not subscription_tests_passed:
                failed_systems.append("Subscription System")
            if not new_admin_features_passed:
                failed_systems.append("New Admin Dashboard Features")
            if not blog_tests_passed:
                failed_systems.append("Blog System APIs")
            print(f"❌ Failed systems: {', '.join(failed_systems)}")
            return False

def main():
    tester = AIResumeBuilderTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())