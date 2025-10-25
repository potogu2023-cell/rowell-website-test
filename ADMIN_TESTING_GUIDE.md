# Admin Backend Testing Guide

## Overview
This guide provides instructions for testing the admin backend functionality of the ROWELL HPLC website.

## Admin Account
- **Email**: admin@rowellhplc.com
- **Password**: admin123456
- **⚠️ Important**: Change this password in production!

## Features to Test

### 1. Admin Login
1. Navigate to `/login`
2. Enter admin credentials
3. After successful login, verify that "Admin Dashboard" appears in the user menu (Shield icon)

### 2. Admin Dashboard
1. Click "Admin Dashboard" in the user menu or navigate to `/admin`
2. Verify the dashboard shows:
   - Inquiry Management card
   - Customer Management card
   - Analytics (Coming Soon)
   - Settings (Coming Soon)

### 3. Inquiry Management (`/admin/inquiries`)

#### View Inquiries
1. Navigate to `/admin/inquiries`
2. Verify the inquiry list displays:
   - Inquiry number
   - Customer name and email
   - Company name
   - Number of items
   - Status badge (Pending/Quoted/Completed/Cancelled)
   - Urgency badge (Normal/Urgent/Very Urgent)
   - Creation date
   - View button

#### Filter Inquiries
1. Test status filter:
   - Select "Pending" - should show only pending inquiries
   - Select "Quoted" - should show only quoted inquiries
   - Select "All Statuses" - should show all inquiries
2. Test urgency filter:
   - Select "Urgent" - should show only urgent inquiries
   - Select "Normal" - should show only normal urgency inquiries
   - Select "All Urgencies" - should show all inquiries

#### View Inquiry Details
1. Click "View" button on any inquiry
2. Verify the details dialog shows:
   - Customer information (name, email, company, phone)
   - Product list with quantities and notes
   - Quoted prices (if any)
   - Status dropdown
   - Admin notes textarea

#### Update Inquiry Status
1. Open inquiry details
2. Change status using the dropdown
3. Verify success toast appears
4. Close dialog and verify status badge updated in the list

#### Add Quote to Product
1. Open inquiry details
2. Find a product without a quoted price
3. Click "Add Quote" button
4. Enter a price (e.g., "$1,200 USD")
5. Verify success toast appears
6. Verify quoted price appears in green

#### Add Admin Notes
1. Open inquiry details
2. Scroll to "Admin Notes" section
3. Type notes in the textarea
4. Click outside the textarea (blur event)
5. Verify success toast appears

### 4. Customer Management (`/admin/customers`)

#### View Customers
1. Navigate to `/admin/customers`
2. Verify the customer list displays:
   - Name
   - Email
   - Company
   - Country
   - Industry
   - Customer tier badge (Regular/VIP)
   - Registration date
   - Last sign-in date
   - Tier update dropdown

#### Filter Customers
1. Test tier filter:
   - Select "VIP" - should show only VIP customers
   - Select "Regular" - should show only regular customers
   - Select "All Tiers" - should show all customers

#### Update Customer Tier
1. Find a regular customer
2. Change tier to "VIP" using the dropdown
3. Verify success toast appears
4. Verify badge changes to VIP (gold with crown icon)
5. Change back to "Regular"
6. Verify badge changes to Regular (outline with user icon)

## Test Scenarios

### Scenario 1: Complete Inquiry Workflow
1. **As Customer**:
   - Register a new account
   - Add products to inquiry cart
   - Submit inquiry
2. **As Admin**:
   - Login to admin dashboard
   - Go to Inquiry Management
   - Find the new inquiry (should be at the top)
   - View details
   - Add quotes to products
   - Add admin notes
   - Update status to "Quoted"
3. **Verify**:
   - Status badge shows "QUOTED"
   - Quoted prices are visible
   - Admin notes are saved

### Scenario 2: Customer Tier Management
1. **As Admin**:
   - Go to Customer Management
   - Find a customer with multiple inquiries
   - Upgrade to VIP tier
2. **Verify**:
   - VIP badge appears
   - Filter by VIP tier shows this customer

### Scenario 3: Inquiry Filtering
1. **As Admin**:
   - Create multiple test inquiries with different statuses and urgencies
   - Test all filter combinations
2. **Verify**:
   - Filters work correctly
   - Counts are accurate

## API Endpoints Tested

### Admin Inquiry APIs
- `admin.inquiries.list` - Get all inquiries with filters
- `admin.inquiries.getById` - Get inquiry details
- `admin.inquiries.updateStatus` - Update inquiry status
- `admin.inquiries.addNotes` - Add admin notes
- `admin.inquiries.addQuote` - Add product quote

### Admin Customer APIs
- `admin.customers.list` - Get all customers with filters
- `admin.customers.updateTier` - Update customer tier
- `admin.customers.getInquiries` - Get customer inquiry history

## Known Limitations

1. **Email Sending**: Currently uses placeholder implementation (console.log). Production requires real email service (SendGrid, AWS SES, etc.)
2. **Analytics**: Not yet implemented (Coming Soon)
3. **Settings**: Not yet implemented (Coming Soon)
4. **Pagination**: Currently shows first 50 items. Implement pagination for large datasets.

## Security Notes

1. All admin routes require authentication and admin role
2. Non-admin users are redirected to login page
3. Admin-only menu items are hidden from regular users
4. Change default admin password before production deployment

## Next Steps

1. Implement email service integration
2. Add analytics dashboard
3. Add settings page
4. Implement pagination for large lists
5. Add export functionality (Excel/PDF) for inquiries
6. Add customer inquiry history view
7. Add automated reminders for pending inquiries

## Troubleshooting

### Cannot access admin pages
- Verify you're logged in with admin account
- Check browser console for errors
- Verify `user.role === "admin"` in the database

### Filters not working
- Check browser console for API errors
- Verify database has inquiries with different statuses/urgencies

### Updates not saving
- Check browser console for mutation errors
- Verify database connection
- Check server logs for errors

