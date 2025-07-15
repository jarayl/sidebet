# SideBet Admin Interface Guide

## Overview

The SideBet admin interface provides comprehensive tools for managing users, markets, system monitoring, and platform administration. Only users with superuser privileges can access the admin interface.

## Accessing the Admin Interface

### Prerequisites
- Must be logged in as a user with `is_superuser = true`
- Admin interface is available at `/admin`

### Navigation
- **From User Interface**: Click your profile dropdown → "Admin Panel"
- **Direct Access**: Navigate to `/admin` (redirects to `/admin/dashboard`)

## Admin Interface Features

### 1. Dashboard (`/admin/dashboard`)

**Real-time System Overview**
- System health status and uptime
- Order success rates and latency metrics
- User and market statistics
- Trading volume overview
- Recent platform activity

**Key Metrics Displayed:**
- System uptime and performance
- Trading engine success rate
- Average response latency
- Active orders and connections
- Platform growth statistics

### 2. Markets Management (`/admin/markets`)

**Market Operations**
- Create new prediction markets with custom contracts
- Edit existing market details and settings
- Manage market lifecycle (open → close → resolve)
- View detailed market statistics and trading activity

**Features:**
- **Search and Filter**: Find markets by title, category, or status
- **Market Creation**: Multi-step form with contract configuration
- **Status Management**: Close markets or resolve with YES/NO/UNDECIDED
- **Real-time Updates**: Live market statistics and trading data

**Market Creation Process:**
1. Fill in market details (title, description, category)
2. Set trading timeframes (start, close, resolve times)
3. Configure contracts (prediction options)
4. Review and create market

### 3. User Management (`/admin/users`)

**User Administration**
- View all registered users with detailed information
- Search users by username or email
- Manage user accounts and permissions
- Adjust user balances and view trading activity

**User Actions:**
- **Status Management**: Activate/suspend user accounts
- **Admin Privileges**: Grant or revoke superuser access
- **Balance Adjustment**: Add or subtract from user balances
- **Account Deletion**: Remove user accounts (with confirmation)
- **Activity Monitoring**: View user trading statistics

**User Statistics Displayed:**
- Total users, active users, admins, unverified accounts
- User search and filtering capabilities
- Individual user details and trading history

### 4. System Monitoring (`/admin/system`)

**Performance Monitoring**
- Real-time system health and performance metrics
- Trading engine concurrency statistics
- Database connection monitoring
- Error tracking and latency analysis

**Key Features:**
- **Real-time Updates**: Auto-refresh every 10 seconds
- **Performance Metrics**: Latency percentiles and distribution
- **Concurrency Tracking**: Retry rates and conflict resolution
- **System Health**: Overall platform status assessment

**Metrics Tracked:**
- Order processing latency (average, 95th, 99th percentile)
- Success rates and retry statistics
- Database connection pool usage
- Trading volume and throughput

## API Endpoints

### Admin-Specific Endpoints (`/api/v1/admin/`)

All admin endpoints require superuser authentication.

**User Management:**
- `GET /admin/users/search?q={query}` - Search users
- `GET /admin/users/stats` - User statistics
- `PUT /admin/users/{user_id}/status` - Update user status
- `PUT /admin/users/{user_id}/admin` - Toggle admin privileges
- `POST /admin/users/{user_id}/balance` - Adjust user balance
- `DELETE /admin/users/{user_id}` - Delete user account

**Market Management:**
- `GET /admin/markets/stats` - Market statistics
- Market creation/editing uses existing `/api/v1/markets/` endpoints

**Dashboard Data:**
- `GET /admin/dashboard/overview` - Dashboard statistics
- `GET /admin/activity/recent` - Recent platform activity

**System Monitoring:**
- `GET /api/v1/system/metrics` - Detailed system metrics
- `GET /api/v1/system/health` - System health status
- `POST /api/v1/system/metrics/reset` - Reset metrics (admin only)

## Security Features

### Authentication & Authorization
- **Route Protection**: All admin routes check for superuser status
- **API Security**: Backend endpoints validate admin privileges
- **Self-Protection**: Admins cannot modify their own critical settings
- **Session Management**: Secure cookie-based authentication

### Data Protection
- **Input Validation**: All forms validate data before submission
- **SQL Injection Prevention**: Parameterized queries throughout
- **XSS Protection**: HTML sanitization on all inputs
- **CSRF Protection**: Token-based request validation

## Best Practices

### Market Management
1. **Clear Descriptions**: Write detailed market descriptions and resolution criteria
2. **Appropriate Timeframes**: Set realistic close and resolve times
3. **Fair Resolution**: Resolve markets objectively based on outcomes
4. **Regular Monitoring**: Check market activity and user feedback

### User Administration
1. **Balance Adjustments**: Document reasons for balance changes
2. **Account Actions**: Warn users before suspensions when possible
3. **Admin Privileges**: Grant admin access sparingly and with trust
4. **Regular Auditing**: Review user activities and system logs

### System Monitoring
1. **Performance Tracking**: Monitor latency and success rates regularly
2. **Capacity Planning**: Watch connection pool usage and system load
3. **Error Analysis**: Investigate recurring errors and conflicts
4. **Maintenance Windows**: Plan updates during low-activity periods

## Troubleshooting

### Common Issues

**Admin Access Denied**
- Verify user has `is_superuser = true` in database
- Check authentication status and re-login if needed
- Ensure admin routes are properly configured

**Market Creation Fails**
- Verify all required fields are filled
- Check date/time formats are valid
- Ensure at least one contract is configured
- Confirm admin permissions

**System Metrics Not Loading**
- Check backend system endpoints are accessible
- Verify trading engine is running properly
- Ensure database connections are healthy

### Performance Issues

**Slow Dashboard Loading**
- Check database query performance
- Monitor system resource usage
- Consider caching for frequently accessed data

**High Latency Metrics**
- Review concurrent trading activity
- Check database connection pool status
- Monitor for potential deadlocks or conflicts

## Development Notes

### Frontend Structure
```
src/app/admin/
├── layout.tsx           # Admin authentication wrapper
├── page.tsx            # Redirect to dashboard
├── dashboard/page.tsx  # Main admin dashboard
├── markets/page.tsx    # Markets management
├── users/page.tsx      # User administration
└── system/page.tsx     # System monitoring
```

### Key Components
- `AdminNavbar`: Admin-specific navigation
- `AdminLayout`: Authentication and layout wrapper
- Various UI components for forms, tables, and metrics display

### Backend Structure
```
backend/app/api/v1/endpoints/
├── admin.py           # Admin-specific endpoints
├── system.py          # System monitoring endpoints
└── ...               # Other existing endpoints
```

This admin interface provides comprehensive tools for managing the SideBet platform effectively while maintaining security and providing detailed insights into system performance and user activity. 