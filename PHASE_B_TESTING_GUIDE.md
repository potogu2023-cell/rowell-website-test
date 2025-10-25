# Phase B Testing Guide - Email Service & Analytics

## Overview
This guide provides instructions for testing the email service integration and analytics dashboard implemented in Phase B.

## Prerequisites
- SendGrid API Key configured in environment variables
- Verified sender email address (info@rowellhplc.com)
- Admin account: admin@rowellhplc.com / admin123456

## Features to Test

### 1. Email Service Integration

#### Inquiry Notification Email
1. **As Customer**:
   - Login with a customer account
   - Add products to inquiry cart
   - Submit an inquiry
2. **Verify Email Sent**:
   - Check info@rowellhplc.com inbox
   - Verify email received with subject: "🔔 New Inquiry: [Inquiry Number] - [Customer Name]"
   - Verify email contains:
     - Customer information (name, email, company, phone, country, industry)
     - Inquiry details (urgency, budget range, delivery address)
     - Product count
     - Excel attachment
3. **Verify Excel Attachment**:
   - Download and open the Excel file
   - Verify it contains:
     - Inquiry header information
     - Customer information section
     - Inquiry details section
     - Products table with all items
     - Total items count

#### Email Content Verification
- HTML email is properly formatted
- All customer information is displayed correctly
- Urgency level is color-coded (red for very urgent, orange for urgent, green for normal)
- WhatsApp contact section is present
- ROWELL branding is consistent

### 2. Analytics Dashboard

#### Access Analytics
1. Login as admin (admin@rowellhplc.com)
2. Navigate to Admin Dashboard
3. Click "Go to Analytics" card
4. Verify redirect to `/admin/analytics`

#### Key Metrics Cards
Verify the following metrics are displayed correctly:
- **Total Inquiries**: Shows total count of all inquiries
- **Total Customers**: Shows total registered customers (active count in subtitle)
- **Quote Rate**: Shows percentage of inquiries that have been quoted
- **Conversion Rate**: Shows percentage of inquiries that have been completed

#### Charts and Visualizations

1. **Inquiry Status Distribution (Pie Chart)**
   - Verify all statuses are shown (pending, quoted, completed, cancelled)
   - Verify colors match status (pending=yellow, quoted=blue, completed=green, cancelled=red)
   - Verify percentages add up to 100%

2. **Inquiry Urgency Distribution (Bar Chart)**
   - Verify all urgency levels are shown (normal, urgent, very_urgent)
   - Verify counts are accurate

3. **Daily Inquiry Trend (Line Chart)**
   - Verify dates are displayed on X-axis
   - Verify inquiry counts are displayed on Y-axis
   - Verify trend line is smooth and continuous

4. **Top 10 Products (List)**
   - Verify products are ranked by inquiry count
   - Verify brand and part number are displayed
   - Verify inquiry count is shown

5. **Customers by Country (Horizontal Bar Chart)**
   - Verify top 10 countries are shown
   - Verify counts are accurate
   - Verify countries are sorted by count (descending)

6. **Customers by Industry (Pie Chart)**
   - Verify top 10 industries are shown
   - Verify counts are accurate
   - Verify different colors for each industry

7. **Customer Tier Distribution (Bar Chart)**
   - Verify both "regular" and "vip" tiers are shown
   - Verify counts are accurate

### 3. Monthly Report

#### Manual Report Generation
1. Navigate to Analytics Dashboard (`/admin/analytics`)
2. Scroll to bottom and click "Send Monthly Report" button
3. Wait for success toast notification
4. Check info@rowellhplc.com inbox
5. Verify email received with subject: "📊 Monthly Report - [Month Year]"
6. Verify email contains:
   - Monthly summary (total inquiries, new customers)
   - List of report contents
7. Download and open Excel attachment
8. Verify Excel contains:
   - Report header with month/year
   - Summary section (report period, total inquiries, new customers)
   - Inquiry status breakdown table
   - Top 10 products table
   - Footer with generation timestamp

#### Report Content Verification
- All statistics are for the previous month
- Percentages in status breakdown are calculated correctly
- Top products are ranked correctly
- Excel formatting is professional and readable

### 4. Integration Testing

#### End-to-End Inquiry Flow
1. **Customer submits inquiry**
   - Register new customer account
   - Browse products
   - Add 3-5 products to inquiry cart
   - Fill out inquiry form with all details
   - Submit inquiry
2. **Email notification received**
   - Verify admin receives email within 1 minute
   - Verify Excel attachment is complete
3. **Admin processes inquiry**
   - Login as admin
   - Go to Inquiry Management
   - Find the new inquiry
   - Add quotes to products
   - Update status to "quoted"
4. **Analytics updated**
   - Go to Analytics Dashboard
   - Verify total inquiries count increased
   - Verify new customer count increased (if new customer)
   - Verify products appear in top products list
   - Verify inquiry status distribution updated

## Test Scenarios

### Scenario 1: High-Volume Inquiry Day
1. Create 10+ inquiries from different customers
2. Verify all emails are sent successfully
3. Verify analytics dashboard shows correct counts
4. Verify daily trend chart shows spike

### Scenario 2: Multi-Status Inquiry Processing
1. Create 5 inquiries
2. Update each to different status (pending, quoted, completed, cancelled, pending)
3. Verify status distribution pie chart shows correct breakdown
4. Verify conversion rate is calculated correctly

### Scenario 3: International Customer Base
1. Register customers from different countries (Pakistan, Dubai, Russia, Brazil, etc.)
2. Submit inquiries from each
3. Verify "Customers by Country" chart shows all countries
4. Verify counts are accurate

### Scenario 4: Product Popularity Tracking
1. Create multiple inquiries with the same products
2. Verify these products appear in "Top 10 Products"
3. Verify inquiry counts are accurate
4. Verify products are ranked correctly

## Known Limitations

1. **Email Sending**:
   - Requires valid SendGrid API Key
   - Sender email must be verified in SendGrid
   - Rate limits apply based on SendGrid plan (free: 100 emails/day)

2. **Monthly Report**:
   - Currently manual trigger only (button click)
   - Automatic scheduling requires external cron service or cloud function
   - Report is for previous month only

3. **Analytics**:
   - No date range filter yet (shows all-time data)
   - No export functionality for charts
   - Limited to 50 items in some queries (pagination not implemented)

## Troubleshooting

### Email not received
- Check SendGrid dashboard for send logs
- Verify API Key is correct
- Verify sender email is verified
- Check spam folder
- Verify email address is correct

### Analytics not loading
- Check browser console for errors
- Verify admin authentication
- Verify database has data
- Check server logs

### Monthly report fails to send
- Verify SendGrid API Key is configured
- Check server logs for error details
- Verify database has data for the month
- Test with a different month

## Next Steps

1. **Automate Monthly Reports**:
   - Set up external cron job to call API on 2nd of each month
   - Or use Vercel Cron Jobs after deployment

2. **Enhance Analytics**:
   - Add date range filters
   - Implement export functionality
   - Add more visualizations (revenue tracking, customer lifetime value, etc.)

3. **Email Templates**:
   - Add company logo to email header
   - Customize email design
   - Add more email types (quote confirmation, order confirmation, etc.)

4. **Performance Optimization**:
   - Implement caching for analytics queries
   - Add pagination for large datasets
   - Optimize database queries

## Support

For issues or questions:
1. Check server logs: `pnpm tsx server/index.ts`
2. Check browser console for frontend errors
3. Review SendGrid dashboard for email delivery status
4. Contact system administrator

---

**Last Updated**: October 25, 2025
**Version**: Phase B - Email Service & Analytics

