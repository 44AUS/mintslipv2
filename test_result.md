#==========================================================================
# TEST CONFIGURATION FILE
#==========================================================================
# EDITING THIS FILE CAN BREAK YOUR TESTS
# Please only update the test_plan section below
# ==========================================================================

backend:
  - task: "Admin Setup Endpoint"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "POST /api/admin/setup endpoint working correctly. Creates default admin account with email admin@mintslip.com and password MINTSLIP2025!. Returns appropriate message when admin already exists."

  - task: "Admin Login Authentication"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "POST /api/admin/login endpoint working correctly. Successfully authenticates with email admin@mintslip.com and password MINTSLIP2025!. Returns token and admin info as expected."

  - task: "Admin Session Verification"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "GET /api/admin/verify endpoint working correctly. Validates Bearer token from login and returns admin information. Session management working properly."

  - task: "Admin Dashboard Statistics"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "GET /api/admin/dashboard endpoint working correctly. Returns comprehensive stats including totalPurchases, totalRevenue, totalUsers, totalSubscribers, todayPurchases, todayRevenue, purchasesByType, and recentPurchases."

  - task: "Purchase Tracking System"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "POST /api/purchases/track endpoint working correctly. Successfully tracks purchases with documentType, amount, paypalEmail, and paypalTransactionId. Returns purchase ID and updates dashboard stats in real-time."

  - task: "Admin Purchases Management"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "GET /api/admin/purchases endpoint working correctly. Returns paginated list of all purchases with proper authentication. Supports filtering and pagination parameters."

  - task: "Subscription Tiers System"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "GET /api/subscription/tiers endpoint working correctly. Returns all 3 subscription tiers: Basic ($19.99/month, 5 downloads), Pro ($29.99/month, 10 downloads), Unlimited ($49.99/month, unlimited downloads)."

frontend:
  - task: "Admin Login UI"
    implemented: true
    working: true
    file: "frontend/src/pages/AdminLogin.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Admin login UI working perfectly. Professional dark theme design with backdrop blur verified. Email and password input fields present and functional. Sign In button works correctly. Successfully authenticates with admin@mintslip.com and MINTSLIP2025! credentials. Redirects properly to dashboard after login."

  - task: "Admin Dashboard UI"
    implemented: true
    working: true
    file: "frontend/src/pages/AdminDashboard.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Admin dashboard UI fully functional. Header displays 'MintSlip Admin' title and admin email correctly. All navigation tabs (Overview, Purchases, Users, Discount Codes) working. Stats cards showing Total Revenue ($19.98), Total Purchases (2), Today's Revenue ($19.98), Today's Purchases (2). Revenue by Document Type section displays Pay Stub data. Recent Purchases table shows 2 purchase records with proper formatting."

  - task: "Admin Dashboard Navigation"
    implemented: true
    working: true
    file: "frontend/src/pages/AdminDashboard.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Tab navigation working correctly. Purchases tab loads with filter dropdown and purchase table showing 2 records. Users tab loads with 'No registered users yet' message (expected for new system). Discount Codes tab loads with 'Manage Discount Codes' button. All tab transitions smooth and functional."

  - task: "Admin Logout Functionality"
    implemented: true
    working: true
    file: "frontend/src/pages/AdminDashboard.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Logout functionality working perfectly. Logout button visible and clickable. Successfully clears session and redirects back to login page. User cannot access dashboard after logout without re-authentication."

metadata:
  created_by: "testing_agent"
  version: "1.0"
  test_sequence: 2
  run_ui: true

test_plan:
  current_focus:
    - "Admin Login and Dashboard functionality"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"
  
# ==========================================================================
# Incorporate User Feedback:
# ==========================================================================
# Add notes from the user about specific changes to test:
# - Admin login with email/password authentication ✅ TESTED AND WORKING
# - Admin dashboard with purchase tracking ✅ TESTED AND WORKING
# - Dashboard statistics display ✅ TESTED AND WORKING
# ==========================================================================

agent_communication:
  - agent: "testing"
    message: "Comprehensive testing completed for Admin Authentication and Dashboard system. All 7 backend endpoints tested and working correctly. Complete flow tested: admin setup → login → session verification → dashboard access → purchase tracking → admin purchases list → subscription tiers. Dashboard stats update in real-time when purchases are tracked. Authentication using Bearer tokens working properly. All requested functionality is operational."
  - agent: "testing"
    message: "FRONTEND TESTING COMPLETE: Admin Login and Dashboard UI flow tested successfully. All components working perfectly - login form with professional dark theme, dashboard with stats cards, navigation tabs (Overview/Purchases/Users/Discount Codes), and logout functionality. Login authenticates correctly with admin@mintslip.com credentials. Dashboard displays real data: $19.98 total revenue, 2 purchases. Tab navigation smooth. Logout properly clears session. UI is fully functional and ready for production use."

# ==========================================================================
# Additional Test Cases for New Admin Features
# ==========================================================================

backend:
  - task: "Admin Update User Subscription Endpoint"
    implemented: true
    working: pending
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history: []
    notes: "PUT /api/admin/users/{user_id}/subscription - Updates user subscription tier (basic, pro, unlimited, or null)"

  - task: "Admin Revenue by Period Endpoint"
    implemented: true
    working: pending
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history: []
    notes: "GET /api/admin/revenue - Returns revenue for specified date range"

frontend:
  - task: "Admin Change User Subscription Modal"
    implemented: true
    working: pending
    file: "frontend/src/pages/AdminDashboard.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history: []
    notes: "Modal to change user subscription from Users tab"

  - task: "Guest vs Registered Customer Labels"
    implemented: true
    working: pending
    file: "frontend/src/pages/AdminDashboard.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history: []
    notes: "Purchases show 'Guest' or 'Registered' badge based on userId"

# ==========================================================================
# Incorporate User Feedback:
# ==========================================================================
# - Admin can now change a user's subscription plan via UI modal
# - All purchases (guest and registered) populate in dashboard with labels
# ==========================================================================
