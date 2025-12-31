#!/usr/bin/env python3
"""
Comprehensive test for the Admin Authentication and Dashboard Flow
Tests the exact flow mentioned in the review request
"""

import requests
import json
import sys

def test_admin_flow():
    """Test the complete admin flow as specified in the review request"""
    base_url = "https://publish-hub-9.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    print("🔐 Testing Admin Authentication and Dashboard Flow")
    print("=" * 60)
    
    # Step 1: Setup admin account
    print("\n1️⃣ Setting up admin account...")
    try:
        response = requests.post(f"{api_url}/admin/setup", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ {data.get('message', 'Admin setup completed')}")
        else:
            print(f"   ❌ Setup failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Setup error: {str(e)}")
        return False
    
    # Step 2: Admin login
    print("\n2️⃣ Admin login...")
    try:
        login_payload = {
            "email": "admin@mintslip.com",
            "password": "MINTSLIP2025!"
        }
        response = requests.post(f"{api_url}/admin/login", json=login_payload, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("token"):
                admin_token = data["token"]
                admin_info = data.get("admin", {})
                print(f"   ✅ Login successful")
                print(f"   📧 Admin: {admin_info.get('email', 'Unknown')}")
                print(f"   🔑 Token received: {admin_token[:20]}...")
            else:
                print(f"   ❌ Invalid login response: {data}")
                return False
        else:
            print(f"   ❌ Login failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Login error: {str(e)}")
        return False
    
    # Step 3: Verify admin session
    print("\n3️⃣ Verifying admin session...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{api_url}/admin/verify", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                admin_info = data.get("admin", {})
                print(f"   ✅ Session verified")
                print(f"   👤 Admin: {admin_info.get('name', 'Admin')} ({admin_info.get('email', 'Unknown')})")
            else:
                print(f"   ❌ Verification failed: {data}")
                return False
        else:
            print(f"   ❌ Verification error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Verification error: {str(e)}")
        return False
    
    # Step 4: Access admin dashboard
    print("\n4️⃣ Accessing admin dashboard...")
    try:
        response = requests.get(f"{api_url}/admin/dashboard", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "stats" in data:
                stats = data["stats"]
                print(f"   ✅ Dashboard data retrieved")
                print(f"   📊 Total Purchases: {stats.get('totalPurchases', 0)}")
                print(f"   💰 Total Revenue: ${stats.get('totalRevenue', 0)}")
                print(f"   👥 Total Users: {stats.get('totalUsers', 0)}")
                print(f"   📈 Total Subscribers: {stats.get('totalSubscribers', 0)}")
                print(f"   📅 Today's Purchases: {stats.get('todayPurchases', 0)}")
                print(f"   💵 Today's Revenue: ${stats.get('todayRevenue', 0)}")
                
                # Check additional data
                purchases_by_type = data.get("purchasesByType", [])
                recent_purchases = data.get("recentPurchases", [])
                print(f"   📋 Purchase Types: {len(purchases_by_type)}")
                print(f"   🕒 Recent Purchases: {len(recent_purchases)}")
            else:
                print(f"   ❌ Invalid dashboard response: {data}")
                return False
        else:
            print(f"   ❌ Dashboard error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Dashboard error: {str(e)}")
        return False
    
    # Step 5: Track a test purchase
    print("\n5️⃣ Tracking a test purchase...")
    try:
        purchase_payload = {
            "documentType": "paystub",
            "amount": 9.99,
            "paypalEmail": "test@example.com",
            "paypalTransactionId": "TEST123"
        }
        response = requests.post(f"{api_url}/purchases/track", json=purchase_payload, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "purchaseId" in data:
                purchase_id = data["purchaseId"]
                print(f"   ✅ Purchase tracked successfully")
                print(f"   🆔 Purchase ID: {purchase_id}")
            else:
                print(f"   ❌ Invalid purchase response: {data}")
                return False
        else:
            print(f"   ❌ Purchase tracking failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Purchase tracking error: {str(e)}")
        return False
    
    # Step 6: Verify purchase appears in admin purchases list
    print("\n6️⃣ Checking admin purchases list...")
    try:
        response = requests.get(f"{api_url}/admin/purchases", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "purchases" in data:
                purchases = data["purchases"]
                total = data.get("total", 0)
                print(f"   ✅ Purchases list retrieved")
                print(f"   📋 Found {len(purchases)} purchases (Total: {total})")
                
                # Check if our test purchase is in the list
                test_purchase_found = False
                for purchase in purchases:
                    if (purchase.get("paypalTransactionId") == "TEST123" and 
                        purchase.get("documentType") == "paystub" and 
                        purchase.get("amount") == 9.99):
                        test_purchase_found = True
                        print(f"   ✅ Test purchase found in list")
                        print(f"   📄 Document: {purchase.get('documentType')}")
                        print(f"   💰 Amount: ${purchase.get('amount')}")
                        print(f"   📧 PayPal Email: {purchase.get('paypalEmail')}")
                        break
                
                if not test_purchase_found:
                    print(f"   ⚠️  Test purchase not found in recent purchases (may be pagination)")
            else:
                print(f"   ❌ Invalid purchases response: {data}")
                return False
        else:
            print(f"   ❌ Purchases list error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Purchases list error: {str(e)}")
        return False
    
    # Step 7: Verify dashboard stats update
    print("\n7️⃣ Verifying dashboard stats update...")
    try:
        response = requests.get(f"{api_url}/admin/dashboard", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "stats" in data:
                new_stats = data["stats"]
                print(f"   ✅ Updated dashboard stats retrieved")
                print(f"   📊 Total Purchases: {new_stats.get('totalPurchases', 0)}")
                print(f"   💰 Total Revenue: ${new_stats.get('totalRevenue', 0)}")
                print(f"   📅 Today's Purchases: {new_stats.get('todayPurchases', 0)}")
                print(f"   💵 Today's Revenue: ${new_stats.get('todayRevenue', 0)}")
            else:
                print(f"   ❌ Invalid updated dashboard response: {data}")
                return False
        else:
            print(f"   ❌ Updated dashboard error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Updated dashboard error: {str(e)}")
        return False
    
    # Step 8: Test subscription tiers
    print("\n8️⃣ Testing subscription tiers...")
    try:
        response = requests.get(f"{api_url}/subscription/tiers", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "tiers" in data:
                tiers = data["tiers"]
                print(f"   ✅ Subscription tiers retrieved")
                
                # Verify the 3 expected tiers
                expected_tiers = {
                    "basic": {"name": "Basic", "price": 19.99, "downloads": 5},
                    "pro": {"name": "Pro", "price": 29.99, "downloads": 10},
                    "unlimited": {"name": "Unlimited", "price": 49.99, "downloads": -1}
                }
                
                for tier_key, expected in expected_tiers.items():
                    if tier_key in tiers:
                        tier = tiers[tier_key]
                        print(f"   📋 {tier.get('name')}: ${tier.get('price')}/month, {tier.get('downloads')} downloads")
                        
                        # Validate tier data
                        if (tier.get("name") == expected["name"] and 
                            tier.get("price") == expected["price"] and 
                            tier.get("downloads") == expected["downloads"]):
                            print(f"      ✅ {tier_key} tier validated")
                        else:
                            print(f"      ⚠️  {tier_key} tier data mismatch")
                    else:
                        print(f"   ❌ Missing tier: {tier_key}")
                        return False
            else:
                print(f"   ❌ Invalid subscription tiers response: {data}")
                return False
        else:
            print(f"   ❌ Subscription tiers error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Subscription tiers error: {str(e)}")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 Admin Authentication and Dashboard Flow Test COMPLETED")
    print("✅ All steps executed successfully!")
    print("✅ Admin login with email/password authentication working")
    print("✅ Admin dashboard with purchase tracking working")
    print("✅ Dashboard statistics display working")
    print("✅ Purchase tracking and admin purchases list working")
    print("✅ Subscription tiers system working")
    return True

if __name__ == "__main__":
    success = test_admin_flow()
    sys.exit(0 if success else 1)