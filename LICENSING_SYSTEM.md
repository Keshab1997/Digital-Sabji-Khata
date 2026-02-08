# VegBillPro Licensing System

## Setup Instructions

### 1. Run SQL in Supabase
Execute `/database/licensing_system.sql` in Supabase SQL Editor to create:
- `user_licenses` table
- `user_payments` table  
- `activity_logs` table
- RLS policies
- Auto-trigger for new user signup

### 2. Super Admin Access
**Email:** keshabsarkar2018@gmail.com
- Only this email can access Super Admin Panel
- Admin button visible only to super admin
- Can approve/reject users
- Can set license expiry dates
- Can manage payments

### 3. How It Works

#### For New Users:
1. User signs up → Auto-creates license with "pending" status
2. Gets 7-day trial period
3. Cannot access app until super admin approves
4. Sees "Access Denied" screen with software price (₹5000)

#### For Super Admin:
1. Login → See Admin button in navbar
2. Admin Panel shows:
   - Total Users
   - Pending Approvals
   - Active Users
   - Total Revenue
3. Can manage each user:
   - Approve/Reject
   - Set license expiry date
   - Record payments
   - Add notes

#### For Approved Users:
1. Can access full app
2. See license info in Admin page (not Super Admin Panel)
3. See software price: ₹5000
4. See license expiry date
5. Get locked out when license expires

### 4. License Types
- **Trial:** 7 days free (auto-created on signup)
- **Paid:** Set by super admin with custom expiry date

### 5. Status Types
- **Pending:** Waiting for approval
- **Approved:** Can use app
- **Rejected:** Cannot use app
- **Expired:** License expired, cannot use app

### 6. Features
✅ Auto license creation on signup
✅ 7-day trial period
✅ Approval system
✅ License expiry tracking
✅ Payment tracking
✅ Activity logging
✅ Revenue dashboard
✅ User management
✅ Software price display (₹5000)
✅ Admin button hidden for regular users

### 7. Security
- RLS policies ensure data isolation
- Only super admin can modify licenses
- Users can only view their own data
- Activity logging for audit trail

### 8. Next Steps
1. Run the SQL in Supabase
2. Sign up with keshabsarkar2018@gmail.com (if not already)
3. Test with a different email to see user flow
4. Approve test user from Admin Panel
5. Add license-check.js to other pages (billing, vendors, etc.)
