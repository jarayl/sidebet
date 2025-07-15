# SideBet Admin System Setup

This guide explains how to manage admin users in your SideBet platform.

## Admin System Overview

The SideBet platform includes a comprehensive admin system that allows administrators to:

- **Manage Markets**: Create, edit, close, and resolve prediction markets
- **Manage Users**: View user information, adjust balances, grant/revoke admin privileges
- **Monitor System**: View real-time performance metrics, trading statistics, and system health
- **Admin Controls**: Promote/demote users, reset passwords, and manage platform settings

## Default Admin User

A default admin user is automatically created when you initialize the database:

- **Username**: `admin`
- **Email**: `admin@college.harvard.edu`
- **Password**: `12345678`

⚠️ **IMPORTANT**: Change this password immediately after first login!

## Logging In as Admin

1. Go to `http://localhost:3000/login`
2. Use the admin credentials above
3. Once logged in, you'll see an "Admin Panel" option in the navbar
4. Click "Admin Panel" to access admin features at `http://localhost:3000/admin`

## Admin Management Tools

### Command Line Tools

We provide several command-line tools for managing admin users:

#### 1. Check Current Admin Users
```bash
cd backend
python admin_tools.py
```

#### 2. List All Users
```bash
python admin_tools.py list
```

#### 3. List Only Admin Users
```bash
python admin_tools.py list --admins
```

#### 4. Create New Admin User
```bash
python admin_tools.py create admin2@college.harvard.edu admin2
```

#### 5. Promote User to Admin
```bash
python admin_tools.py promote username_or_email
```

#### 6. Demote Admin to Regular User
```bash
python admin_tools.py demote username_or_email
```

#### 7. Reset User Password
```bash
python admin_tools.py reset-password username_or_email --password newpassword123
```

### Web Interface Admin Management

Once logged in as an admin, you can also manage users through the web interface:

1. Go to **Admin Panel** → **Users Management**
2. Search for users by username or email
3. Use the actions menu to:
   - Grant/revoke admin privileges
   - Activate/deactivate accounts
   - Adjust user balances
   - Delete accounts

## Admin Capabilities

### Dashboard (`/admin/dashboard`)
- System uptime and health status
- User and market statistics
- Trading volume and activity metrics
- Recent platform activity feed

### Markets Management (`/admin/markets`)
- Create new prediction markets with custom contracts
- Edit existing market details
- Close markets to stop trading
- Resolve markets with YES/NO/UNDECIDED outcomes
- Search and filter markets by status/category

### Users Management (`/admin/users`)
- Search users by username/email
- View detailed user statistics and trading history
- Grant/revoke admin privileges
- Adjust user balances (add/set amounts)
- Activate/deactivate user accounts
- Delete user accounts

### System Monitoring (`/admin/system`)
- Real-time trading engine performance metrics
- Database connection and latency monitoring
- Error tracking and concurrency statistics
- System health alerts and warnings

## Security Features

### Access Control
- Only users with `is_superuser = true` can access admin features
- Admin routes are protected both in frontend and backend
- Self-protection: Admins cannot modify their own critical settings

### Admin Privileges
Admins can:
- ✅ Create, edit, and resolve markets
- ✅ View all user information and statistics
- ✅ Adjust user balances and account status
- ✅ Grant admin privileges to other users
- ✅ Access system monitoring and metrics

Admins cannot:
- ❌ Remove their own admin privileges
- ❌ Delete their own account
- ❌ Access other admin passwords

### Safety Measures
- Cannot demote the last admin user
- Confirmation dialogs for destructive actions
- Audit trails for admin actions (in system logs)
- Password requirements for sensitive operations

## Best Practices

### Initial Setup
1. **Change default password**: Log in as `admin` and change the password
2. **Create personal admin account**: Create an admin account with your email
3. **Demote default admin**: Consider demoting the default `admin` account after creating your personal admin

### User Management
1. **Use email addresses**: Prefer promoting existing users rather than creating new admin accounts
2. **Principle of least privilege**: Only grant admin access when necessary
3. **Regular audits**: Periodically review admin user list

### Security
1. **Strong passwords**: Enforce strong password policies
2. **Monitor activity**: Regularly check admin activity logs
3. **Backup access**: Ensure multiple trusted admins exist

## Troubleshooting

### Cannot Access Admin Panel
- Verify you're logged in with an admin account (`is_superuser = true`)
- Check that the user account is active (`is_active = true`)
- Ensure you're accessing the correct URL (`/admin`)

### Cannot Promote Users
- Verify you have admin privileges
- Check that the target user exists and is active
- Ensure you're using the correct username or email

### Database Issues
- Use the command-line tools if web interface is not working
- Check database connectivity and table structure
- Verify admin endpoints are properly imported in the API router

## Development Notes

### Database Schema
Admin status is controlled by the `is_superuser` boolean field in the `users` table.

### API Endpoints
Admin endpoints are available at `/api/v1/admin/` and require superuser authentication.

### Frontend Components
- `AdminNavbar`: Navigation bar for admin interface
- `AdminLayout`: Layout wrapper with authentication checks
- Admin pages: Dashboard, Markets, Users, System monitoring

For technical details, see `ADMIN_GUIDE.md` for the complete API documentation. 