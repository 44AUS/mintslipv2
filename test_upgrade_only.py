#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_test import AIResumeBuilderTester

def test_upgrade_only():
    """Test only the subscription upgrade functionality"""
    tester = AIResumeBuilderTester()
    
    print("🚀 Testing Subscription Upgrade System Only")
    print("=" * 60)
    
    # First setup admin and user
    print("\n👤 Setting up admin and user...")
    admin_setup_ok = tester.test_admin_setup()  # This might fail if already setup
    admin_login_ok = tester.test_admin_login()
    user_registration_ok = tester.test_user_registration()
    user_login_ok = tester.test_user_login()
    
    # Admin setup can fail if already completed, so we only need login to work
    if not (admin_login_ok and user_registration_ok and user_login_ok):
        print("❌ Failed to setup admin and user")
        return False
    
    print("\n⬆️ Testing Subscription Upgrade System...")
    upgrade_calculate_ok = tester.test_subscription_upgrade_calculate()
    upgrade_create_order_ok = tester.test_subscription_upgrade_create_order()
    upgrade_validation_ok = tester.test_subscription_upgrade_validation_errors()
    
    print(f"\n📊 Upgrade Tests: {tester.tests_passed}/{tester.tests_run} passed")
    
    return upgrade_calculate_ok and upgrade_create_order_ok and upgrade_validation_ok

if __name__ == "__main__":
    success = test_upgrade_only()
    sys.exit(0 if success else 1)