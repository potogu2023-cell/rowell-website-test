# Email Functionality Scope

## Overview

This document clarifies the scope and purpose of email functionality in the ROWELL HPLC website.

---

## Email Types

### ✅ Business Notification Emails (Included in this project)

These are **operational emails** that are essential for the website's normal business operations:

#### 1. Inquiry Notification Email
- **Trigger**: When a customer submits an inquiry
- **Recipient**: `info@rowellhplc.com` (admin)
- **Purpose**: Notify admin of new customer inquiries
- **Content**: Customer information, inquiry details, product list (Excel attachment)
- **Function**: `sendInquiryEmail()` in `server/inquiry-utils.ts`

#### 2. Customer Confirmation Email
- **Trigger**: When a customer submits an inquiry
- **Recipient**: Customer's email address
- **Purpose**: Confirm receipt of inquiry and set expectations
- **Content**: Inquiry number, thank you message, response timeline
- **Function**: `sendCustomerConfirmationEmail()` in `server/inquiry-utils.ts`

#### 3. Monthly Report Email
- **Trigger**: Automated (2nd of each month)
- **Recipient**: `info@rowellhplc.com` (admin)
- **Purpose**: Provide monthly business statistics
- **Content**: Total inquiries, new customers, top products (Excel attachment)
- **Function**: `sendMonthlyReport()` in `server/monthly-report.ts`

---

### ❌ Marketing Campaign Emails (NOT included in this project)

These are **outbound marketing emails** that should be handled by a dedicated email marketing system:

#### Examples:
- Cold outreach emails to potential customers
- Product promotion campaigns
- Newsletter broadcasts
- Follow-up sequences
- Re-engagement campaigns

#### Why separate?
1. **Different tools**: Marketing campaigns require specialized tools (e.g., Lemlist, Mailchimp)
2. **Different workflows**: Campaign management, A/B testing, segmentation
3. **Different compliance**: CAN-SPAM, GDPR requirements for marketing emails
4. **Task purity**: Keep website operations separate from marketing campaigns

---

## Technical Implementation

### SendGrid Configuration

**Environment Variables**:
```
SENDGRID_API_KEY=SG.xxx...
SENDGRID_FROM_EMAIL=noreply@rowellhplc.com
```

**Email Templates**:
- All emails use HTML + plain text format
- Professional branding with ROWELL HPLC identity
- Clear call-to-action and contact information

**Error Handling**:
- Graceful degradation if SendGrid is not configured
- Inquiry data is always saved to database (email is secondary)
- Errors are logged but don't block the inquiry process

---

## Best Practices

### For Business Notification Emails

1. **Keep it simple**: Transactional emails should be clear and concise
2. **No marketing content**: Focus on the transaction/notification only
3. **Reliable delivery**: Use SendGrid's transactional email API
4. **Track failures**: Log email sending errors for debugging

### For Marketing Campaign Emails

1. **Use dedicated tools**: Lemlist, Mailchimp, or similar platforms
2. **Separate task**: Create a dedicated "Email Marketing" task in Manus
3. **Comply with regulations**: Follow CAN-SPAM, GDPR, etc.
4. **Monitor metrics**: Track open rates, click rates, conversions

---

## Summary

| Feature | Business Notifications | Marketing Campaigns |
|---------|----------------------|---------------------|
| **Purpose** | Operational | Promotional |
| **Trigger** | User action | Scheduled/Manual |
| **Tool** | SendGrid (transactional) | Lemlist/Mailchimp |
| **Included in this project** | ✅ Yes | ❌ No |
| **Recipient** | Admin + Customers | Prospects |
| **Content** | Transaction details | Marketing content |

---

## Related Documents

- **Email Marketing Task Instructions**: `/home/ubuntu/ROWELL_EMAIL_MARKETING_TASK_INSTRUCTION.md`
- **Email Marketing Monitoring System**: `/home/ubuntu/EMAIL_MARKETING_MONITORING_SYSTEM.md`

---

**Last Updated**: 2025-01-03
