# Phase C Testing Guide

## Overview
Phase C implements three major features:
1. **Multi-language Support (i18n)**
2. **WhatsApp Integration**
3. **PDF Quotation Generation**

---

## 1. Multi-language Support

### Features Implemented
- ✅ i18n framework configured (react-i18next)
- ✅ Language switcher component in navbar
- ✅ Translation files for English, Chinese (中文), and Russian (Русский)

### Testing Steps

#### 1.1 Language Switcher
1. Navigate to any page
2. Look for the language switcher in the top-right corner of the navbar
3. Click on the language dropdown (shows flag + language name)
4. Select different languages:
   - 🇬🇧 English
   - 🇨🇳 中文
   - 🇷🇺 Русский
5. Verify the language persists across page navigation

#### 1.2 Translation Coverage
**Note:** Currently, translation files are created but not all pages are fully translated yet. The framework is in place for future expansion.

**To add translations to a page:**
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('common.welcome')}</h1>;
}
```

---

## 2. WhatsApp Integration

### Features Implemented
- ✅ Floating WhatsApp button (bottom-right corner)
- ✅ QR code dialog for easy mobile scanning
- ✅ Direct WhatsApp link with pre-filled message

### Testing Steps

#### 2.1 Floating Button
1. Navigate to any page
2. Look for the green circular button in the bottom-right corner
3. Verify the button shows a message icon

#### 2.2 WhatsApp Dialog
1. Click the WhatsApp floating button
2. Verify a dialog opens with:
   - WhatsApp QR code image
   - Instructions for scanning
   - "Open WhatsApp" button
3. Scan the QR code with your phone
4. Verify it opens a WhatsApp conversation

#### 2.3 Direct Link
1. Click "Open WhatsApp" button in the dialog
2. Verify it opens WhatsApp Web/Desktop in a new tab
3. Verify the message is pre-filled:
   > "Hello! I'm interested in your HPLC products and would like to get a quote."

---

## 3. PDF Quotation Generation

### Features Implemented
- ✅ PDF generation API (PDFKit)
- ✅ Download button in admin inquiry details
- ✅ Professional PDF layout with company branding

### Testing Steps

#### 3.1 Prerequisites
1. Create a test inquiry (as a customer):
   - Register/login as a customer
   - Add products to inquiry cart
   - Submit an inquiry

2. Login as admin:
   - Email: admin@rowellhplc.com
   - Password: admin123456

#### 3.2 Add Quotes (Optional)
1. Navigate to `/admin/inquiries`
2. Click "View Details" on an inquiry
3. For each product, click "Add Quote"
4. Enter a price (e.g., "150.00")
5. Verify the quoted price appears

#### 3.3 Generate PDF
1. In the inquiry details dialog, scroll down
2. Find the "Download PDF Quotation" button
3. Click the button
4. Verify:
   - Button shows "Generating..." during processing
   - PDF file downloads automatically
   - Filename format: `quotation-INQ-XXXXXXXX-XXX.pdf`

#### 3.4 Verify PDF Content
Open the downloaded PDF and verify it contains:
- ✅ ROWELL branding/header
- ✅ Quotation title and inquiry number
- ✅ Customer information (name, company, email, phone, country)
- ✅ Inquiry details (status, urgency, budget, delivery address)
- ✅ Products table with:
  - Product names
  - Quantities
  - Quoted prices (if added)
  - Subtotals
  - Total amount
- ✅ Customer notes (if provided)
- ✅ Admin notes (if added)
- ✅ Company contact information in footer

---

## 4. Integration Testing

### Test Scenario: Complete Workflow
1. **Customer Journey:**
   - Browse products in preferred language (switch language)
   - Add products to inquiry cart
   - Submit inquiry
   - Receive confirmation

2. **Admin Journey:**
   - View inquiry in admin panel
   - Add quotes to products
   - Update inquiry status to "Quoted"
   - Add admin notes
   - Generate and download PDF quotation

3. **Communication:**
   - Customer clicks WhatsApp button
   - Opens conversation with pre-filled message
   - Shares inquiry details via WhatsApp

---

## 5. Known Limitations

### Multi-language
- Translation files are created but not all UI text is translated yet
- Need to manually add `t('key')` to each component
- Framework is ready for future expansion

### WhatsApp
- WhatsApp number is hardcoded: +86 189 3053 9593
- To change, edit `/client/src/components/WhatsAppButton.tsx`

### PDF Generation
- Currently uses hardcoded USD currency
- Logo is text-based (can be replaced with image)
- PDF styling is basic but professional

---

## 6. Configuration

### WhatsApp Number
File: `/client/src/components/WhatsAppButton.tsx`
```tsx
const whatsappNumber = "+8618930539593"; // Change this
```

### Translation Files
Location: `/client/src/i18n/locales/`
- `en.json` - English
- `zh.json` - Chinese
- `ru.json` - Russian

### PDF Styling
File: `/server/pdf-utils.ts`
- Modify colors, fonts, layout as needed

---

## 7. Next Steps

### Recommended Enhancements
1. **Complete translations** for all pages
2. **Add more languages** (Spanish, Portuguese, Arabic, etc.)
3. **Enhance PDF design** with company logo image
4. **Add PDF email attachment** to inquiry notifications
5. **Multi-currency support** in PDF quotations

---

## Support

For issues or questions:
- Check browser console for errors
- Verify all dependencies are installed
- Ensure SendGrid API key is configured (for email features)
- Contact development team for assistance

---

**Last Updated:** Phase C Completion
**Version:** 1.0.0

