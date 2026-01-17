#!/usr/bin/env python3
"""
Test script for email service rate limiting fix
Tests 3 rapid user signups and verifies all emails are sent successfully
"""

import requests
import time
import pymongo
import sys

def test_email_rate_limiting_fix():
    """Test email service rate limiting fix with 3 rapid user signups"""
    
    # Configuration
    base_url = "https://native-paystubs.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    print("🔄 Testing Email Service Rate Limiting Fix")
    print("=" * 60)
    print(f"Backend URL: {base_url}")
    print("Performing 3 rapid user signups to test rate limiting...")
    
    try:
        # Connect to MongoDB to check email logs
        mongo_client = pymongo.MongoClient("mongodb://localhost:27017")
        db = mongo_client["mintslip_db"]
        
        # Create 3 unique test users rapidly
        timestamp = int(time.time())
        test_users = []
        signup_results = []
        
        print("\n📝 Creating users rapidly...")
        for i in range(3):
            test_email = f"ratelimit_test_{timestamp}_{i}@mintslip.com"
            test_name = f"Rate Limit Test User {i+1}"
            
            payload = {
                "email": test_email,
                "password": "TestPassword123!",
                "name": test_name
            }
            
            print(f"  {i+1}. Creating user: {test_email}")
            
            # Perform signup immediately (no delay between signups)
            response = requests.post(f"{api_url}/user/signup", json=payload, timeout=15)
            
            signup_result = {
                "email": test_email,
                "name": test_name,
                "status_code": response.status_code,
                "success": response.status_code == 200
            }
            
            if response.status_code == 200:
                data = response.json()
                signup_result["user_created"] = data.get("success", False)
                print(f"     ✅ User created successfully")
            else:
                try:
                    error_data = response.json()
                    signup_result["error"] = error_data.get("detail", "Unknown error")
                    print(f"     ❌ Failed: {signup_result['error']}")
                except:
                    signup_result["error"] = response.text
                    print(f"     ❌ Failed: {response.text}")
            
            signup_results.append(signup_result)
            test_users.append(test_email)
            
            # Small delay to allow async email processing but still test rapid signups
            time.sleep(0.5)
        
        # Wait for all emails to be processed (rate limiting delays)
        print("\n⏳ Waiting for emails to be processed (accounting for rate limiting delays)...")
        time.sleep(12)  # Wait longer to account for rate limiting delays
        
        # Check email logs for all users
        print("\n📧 Checking email delivery status...")
        email_verification_results = []
        all_emails_sent = True
        
        for i, email in enumerate(test_users):
            print(f"\n  User {i+1}: {email}")
            
            # Check for welcome email
            welcome_email = db.email_logs.find_one({
                "to": email,
                "email_type": "welcome"
            })
            
            # Check for verification email
            verification_email = db.email_logs.find_one({
                "to": email,
                "email_type": "verification"
            })
            
            user_result = {
                "email": email,
                "welcome_email_found": welcome_email is not None,
                "welcome_email_status": welcome_email.get("status") if welcome_email else None,
                "verification_email_found": verification_email is not None,
                "verification_email_status": verification_email.get("status") if verification_email else None
            }
            
            # Check if both emails were sent successfully
            welcome_sent = welcome_email and welcome_email.get("status") == "sent"
            verification_sent = verification_email and verification_email.get("status") == "sent"
            
            user_result["welcome_sent"] = welcome_sent
            user_result["verification_sent"] = verification_sent
            user_result["both_emails_sent"] = welcome_sent and verification_sent
            
            if not (welcome_sent and verification_sent):
                all_emails_sent = False
            
            email_verification_results.append(user_result)
            
            # Print detailed status
            welcome_status = welcome_email.get("status") if welcome_email else "NOT FOUND"
            verification_status = verification_email.get("status") if verification_email else "NOT FOUND"
            
            print(f"    Welcome email: {'✅ SENT' if welcome_sent else '❌ NOT SENT'} (status: {welcome_status})")
            print(f"    Verification email: {'✅ SENT' if verification_sent else '❌ NOT SENT'} (status: {verification_status})")
            
            # Show additional details if emails failed
            if welcome_email and welcome_email.get("status") == "failed":
                error_msg = welcome_email.get("error_message", "Unknown error")
                print(f"      Welcome email error: {error_msg}")
            
            if verification_email and verification_email.get("status") == "failed":
                error_msg = verification_email.get("error_message", "Unknown error")
                print(f"      Verification email error: {error_msg}")
        
        mongo_client.close()
        
        # Compile results
        successful_signups = sum(1 for result in signup_results if result["success"])
        successful_email_pairs = sum(1 for result in email_verification_results if result["both_emails_sent"])
        
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS")
        print("=" * 60)
        
        print(f"User Signups: {successful_signups}/3 successful")
        print(f"Email Pairs Sent: {successful_email_pairs}/3 successful")
        
        # Detailed breakdown
        for i, result in enumerate(email_verification_results):
            status = "✅ PASS" if result["both_emails_sent"] else "❌ FAIL"
            print(f"  User {i+1}: {status}")
        
        # Overall result
        success = (successful_signups == 3 and successful_email_pairs == 3)
        
        if success:
            print("\n🎉 RATE LIMITING FIX TEST PASSED!")
            print("✅ All 3 users created successfully")
            print("✅ All welcome emails sent with status 'sent'")
            print("✅ All verification emails sent with status 'sent'")
            print("✅ No rate limit failures detected")
            return True
        else:
            print("\n❌ RATE LIMITING FIX TEST FAILED!")
            
            if successful_signups < 3:
                failed_signups = [r for r in signup_results if not r["success"]]
                print(f"❌ {len(failed_signups)} user signup(s) failed:")
                for failed in failed_signups:
                    print(f"   - {failed['email']}: {failed.get('error', 'Unknown error')}")
            
            if successful_email_pairs < 3:
                failed_emails = [r for r in email_verification_results if not r["both_emails_sent"]]
                print(f"❌ {len(failed_emails)} email pair(s) failed:")
                for failed in failed_emails:
                    print(f"   - {failed['email']}: Welcome={failed['welcome_email_status']}, Verification={failed['verification_email_status']}")
            
            return False
            
    except Exception as e:
        print(f"\n❌ TEST FAILED WITH EXCEPTION: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_email_rate_limiting_fix()
    sys.exit(0 if success else 1)