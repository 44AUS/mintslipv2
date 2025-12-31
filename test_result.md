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
    - "Admin dashboard UI testing completed successfully - all features working"
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
  - agent: "testing"
    message: "NEW ADMIN DASHBOARD FEATURES TESTING COMPLETE: All new admin features tested and working perfectly. Admin Update User Subscription endpoint (PUT /api/admin/users/{user_id}/subscription) successfully tested for all tiers (basic, pro, unlimited) and subscription removal. Downloads reset to 0 on subscription changes. AdminAssigned flag working correctly. Admin Revenue by Period endpoint (GET /api/admin/revenue) working with all parameter combinations (no params, startDate only, startDate+endDate). Full admin flow tested: login → get users → update subscription → verify → get revenue stats. All endpoints returning proper responses with correct data structure. System ready for production use."
  - agent: "testing"
    message: "COMPREHENSIVE ADMIN DASHBOARD UI TESTING COMPLETE: All requested features tested and working perfectly. ✅ Admin login flow with admin@mintslip.com/MINTSLIP2025! credentials working. ✅ Overview tab showing stats cards (Yearly Revenue: $29.97, Total Purchases: 3, Today's Revenue: $29.97) with period revenue dropdown (This Week/Month/Quarter/Year) working. ✅ Recent Purchases table displaying Customer column with Guest badges properly. ✅ Purchases tab with document type filter dropdown (All Types, Pay Stub, W-2, etc.) working. ✅ Customer column in Purchases table showing Guest/Registered badges correctly. ✅ Delete buttons visible in Actions column. ✅ Users tab loading with 'No registered users yet' message (expected). ✅ Change Subscription modal structure implemented and ready (tested modal opening, plan selection dropdown with Basic/Pro/Unlimited/No Subscription options, plan details display). ✅ Header showing 'MintSlip Admin' and admin email. ✅ Refresh and Logout buttons working. ✅ Smooth tab navigation between Overview/Purchases/Users. All admin dashboard features are fully functional and ready for production use."

# ==========================================================================
# Additional Test Cases for New Admin Features
# ==========================================================================

backend:
  - task: "Admin Update User Subscription Endpoint"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "PUT /api/admin/users/{user_id}/subscription endpoint working perfectly. Successfully tested all subscription tier updates (basic, pro, unlimited) and subscription removal (null). Verified adminAssigned flag is set correctly and downloads are reset to 0 when subscription changes. All tier transitions working as expected."

  - task: "Admin Revenue by Period Endpoint"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "GET /api/admin/revenue endpoint working correctly. Successfully tested all-time revenue retrieval (no parameters), revenue with startDate parameter, and revenue with both startDate and endDate parameters. Response includes revenue amount, purchaseCount, and period information as expected. Date filtering working properly."

  - task: "Blog Categories API"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "GET /api/blog/categories endpoint working correctly. Returns all 5 default categories (Pay Stubs, Proof of Income, Payroll, Taxes, Employment) with post counts included. Public endpoint accessible without authentication."

  - task: "Blog Posts Public API"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "GET /api/blog/posts endpoint working correctly. Returns published posts with pagination, filtering by category, search functionality, and proper response structure. All query parameters (page, limit, category, tag, search, sort) working as expected."

  - task: "Blog Post by Slug API"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "GET /api/blog/posts/{slug} endpoint working correctly. Successfully retrieves published posts by slug, increments view count on each access, and returns related posts from the same category. Public endpoint working as expected."

  - task: "Admin Blog Posts Management"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Admin blog endpoints working correctly: GET /api/admin/blog/posts (list all posts including drafts), GET /api/admin/blog/posts/{post_id} (get single post by ID), POST /api/admin/blog/posts (create new post), PUT /api/admin/blog/posts/{post_id} (update post), DELETE /api/admin/blog/posts/{post_id} (delete post). All require Bearer token authentication."

  - task: "Blog Image Upload API"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "POST /api/admin/blog/upload-image endpoint working correctly. Successfully uploads images (JPEG, PNG, WebP, GIF) to /app/backend/uploads/blog/ directory and returns accessible URL. File validation and unique filename generation working properly."

frontend:
  - task: "Admin Change User Subscription Modal"
    implemented: true
    working: true
    file: "frontend/src/pages/AdminDashboard.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Change Subscription modal functionality fully implemented and working. Modal opens correctly from Users tab three-dot action menu. Plan selection dropdown includes all tiers (Basic, Pro, Unlimited, No Subscription) with proper pricing display. Plan details show when tier is selected. Modal can be cancelled properly. Feature ready for use when registered users exist in the system."

  - task: "Guest vs Registered Customer Labels"
    implemented: true
    working: true
    file: "frontend/src/pages/AdminDashboard.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "Guest vs Registered customer labels working perfectly. Both Recent Purchases table (Overview tab) and All Purchases table (Purchases tab) correctly display 'Guest' badges for purchases without userId and 'Registered' badges for purchases with userId. Customer column shows email address with appropriate badge styling. Currently showing 3 Guest purchases in the system."

  - task: "Blog Management Admin Page"
    implemented: true
    working: false
    file: "frontend/src/pages/AdminBlog.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history: []

  - task: "Blog WYSIWYG Editor"
    implemented: true
    working: false
    file: "frontend/src/pages/AdminBlogEditor.js, frontend/src/components/TiptapEditor.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history: []

  - task: "Public Blog Index Page"
    implemented: true
    working: false
    file: "frontend/src/pages/Blog.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history: []

  - task: "Public Blog Post Page"
    implemented: true
    working: false
    file: "frontend/src/pages/BlogPost.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history: []

# ==========================================================================
# Incorporate User Feedback:
# ==========================================================================
# - Admin can now change a user's subscription plan via UI modal
# - All purchases (guest and registered) populate in dashboard with labels
# - Blog Phase 1: WYSIWYG editor, admin blog management, public blog pages
# ==========================================================================
