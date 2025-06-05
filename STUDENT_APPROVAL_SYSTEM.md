# Student Registration Approval System

## Overview
Admins can now approve new student registrations through a comprehensive user management system. This document outlines the complete workflow and features.

## Registration Flow

### 1. Student Registration Process
1. **Student Signs Up**: New students register via `/auth/signup`
   - Provide name, email, password, student ID, room number, phone
   - Select their university from the dropdown
   - Status automatically set to `PENDING`

2. **Pending State**: Account is created but cannot login until approved
   - User status: `PENDING`
   - Cannot access any protected routes
   - Waiting for admin approval

### 2. Admin Approval Process
1. **Dashboard Notifications**: Admin sees pending registrations on dashboard
   - Orange notification badge with count
   - Alert section highlighting pending students
   - Real-time counter updates

2. **User Management Page**: Navigate to `/admin/users`
   - View all users with filtering options
   - Status tabs: Pending, Approved, Rejected, Suspended
   - Search by name, email, student ID, room, course
   - Filter by role: Students, Admins, Caterers

3. **Review Student Details**: Each student card shows:
   - Personal information (name, email, phone)
   - University details
   - Student ID and room number
   - Registration date and time
   - Current status with visual indicators

4. **Approval Actions**: For pending students
   - ✅ **Approve**: Grants access to the application
   - ❌ **Reject**: Denies access with optional reason
   - 📧 **Email**: Direct contact with student

## Features

### Admin Dashboard
- **Live Statistics**: Real-time count of pending registrations
- **Visual Alerts**: Orange notifications when students await approval
- **Quick Access**: Direct links to user management
- **Status Overview**: Summary of all user statuses

### User Management Interface
- **Status Filtering**: View users by approval status
- **Advanced Search**: Find users by multiple criteria
- **Bulk Operations**: Process multiple approvals efficiently
- **Audit Trail**: Track registration dates and login history

### Approval Actions
```typescript
// Available status transitions
PENDING → APPROVED   // Grant access
PENDING → REJECTED   // Deny access
APPROVED → SUSPENDED // Temporarily disable
SUSPENDED → APPROVED // Reactivate account
REJECTED → APPROVED  // Give second chance
```

## User Statuses

### PENDING
- **Description**: Newly registered, awaiting approval
- **Access Level**: Cannot login or access any features
- **Admin Actions**: Approve, Reject, Email
- **UI Indicator**: Orange badge with clock icon

### APPROVED
- **Description**: Verified student with full access
- **Access Level**: Complete application functionality
- **Admin Actions**: Suspend, Email
- **UI Indicator**: Green badge with checkmark icon

### REJECTED
- **Description**: Registration denied by admin
- **Access Level**: Cannot login, no access
- **Admin Actions**: Reactivate, Email
- **UI Indicator**: Red badge with X icon

### SUSPENDED
- **Description**: Temporarily disabled account
- **Access Level**: Cannot login while suspended
- **Admin Actions**: Reactivate, Email
- **UI Indicator**: Yellow badge with warning icon

## Security Features

### University Isolation
- Admins can only manage students from their own university
- Cross-university access is prevented
- Data security through proper access controls

### Role-Based Access
- Only ADMIN role users can approve registrations
- Students cannot modify their own status
- Proper authentication checks on all endpoints

### Data Protection
- Sensitive information (passwords) removed from responses
- Audit logging for all status changes
- Secure API endpoints with proper validation

## API Endpoints

### GET /api/admin/users
```typescript
// Fetch all users for admin's university
Response: {
  success: true,
  users: UserData[]
}
```

### PATCH /api/admin/users/[id]
```typescript
// Update user status
Body: {
  status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING',
  rejectionReason?: string
}
```

## Notification System

### Dashboard Alerts
- Badge count on bell icon in header
- Prominent alert banner for pending registrations
- Visual indicators throughout the interface

### Status Feedback
- Success notifications for successful approvals
- Error messages for failed operations
- Toast notifications with clear messaging

## User Experience

### For Admins
1. **Immediate Awareness**: Dashboard shows pending count
2. **Efficient Workflow**: Single-click approval/rejection
3. **Complete Information**: All student details visible
4. **Bulk Processing**: Handle multiple requests quickly
5. **Communication**: Direct email contact options

### For Students
1. **Clear Feedback**: Know their application is pending
2. **No Ambiguity**: Cannot access until approved
3. **Professional Process**: Proper approval workflow
4. **Status Transparency**: Clear messaging about account state

## Implementation Details

### Database Schema
```prisma
model User {
  id          String     @id @default(cuid())
  email       String     @unique
  name        String
  phone       String?
  role        UserRole   @default(STUDENT)
  status      UserStatus @default(PENDING)  // Key field
  studentId   String?
  roomNumber  String?
  university  University @relation(fields: [universityId], references: [id])
  universityId String
  createdAt   DateTime   @default(now())
  lastLoginAt DateTime?
}

enum UserStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}
```

### Frontend Components
- `AdminDashboard`: Shows pending registration alerts
- `AdminUsers`: Complete user management interface
- `NotificationSystem`: Toast notifications for actions
- `UserCard`: Individual student information display

### Backend Logic
- University-scoped user queries
- Status validation and transitions
- Email notification triggers (ready for implementation)
- Audit logging capabilities

## Setup Instructions

### 1. Database Setup
```bash
# Ensure UserStatus enum includes all required values
npx prisma generate
npx prisma db push
```

### 2. Admin Account Creation
```bash
# Create admin user with ADMIN role
# Set status to APPROVED for immediate access
```

### 3. University Configuration
```bash
# Ensure universities are properly seeded
# Admin and students must belong to same university
```

## Testing Workflow

### 1. Student Registration Test
1. Go to `/auth/signup`
2. Register with student details
3. Verify account shows PENDING status
4. Confirm cannot login

### 2. Admin Approval Test
1. Login as admin user
2. Check dashboard shows pending count
3. Navigate to user management
4. Approve pending student
5. Verify student can now login

### 3. Status Management Test
1. Test all status transitions
2. Verify UI updates correctly
3. Confirm proper access controls
4. Test email functionality

## Future Enhancements

### Email Notifications
- Automatic approval/rejection emails
- Welcome messages for approved students
- Reminder emails for pending applications

### Bulk Operations
- Select multiple students for batch approval
- Import student lists from CSV
- Automated approval based on criteria

### Advanced Filtering
- Filter by registration date range
- Sort by university, course, year
- Export user lists for reporting

### Analytics
- Registration trends over time
- Approval rate statistics
- University-wise breakdowns

## Troubleshooting

### Common Issues
1. **Admin can't see students**: Check university assignment
2. **Status not updating**: Verify API permissions
3. **Dashboard not loading**: Check user role and authentication
4. **Students from wrong university**: Review university scoping

### Debug Commands
```bash
# Check user status in database
npx prisma studio

# View API logs
npm run dev (check terminal output)

# Test API endpoints
curl -X GET /api/admin/users (with proper auth)
```

This system provides a complete, secure, and user-friendly workflow for managing student registrations in the hostel food ordering application. 