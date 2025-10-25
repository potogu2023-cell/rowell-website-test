import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import * as schema from '../drizzle/schema';

interface InquiryWithDetails {
  inquiry: typeof schema.inquiries.$inferSelect;
  customer: typeof schema.users.$inferSelect;
  items: Array<{
    product: typeof schema.products.$inferSelect;
    quantity: number;
    notes: string | null;
    quotedPrice: number | null;
    quotedCurrency: string | null;
  }>;
}

export async function generateInquiryPDF(data: InquiryWithDetails): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with Logo (if available)
      doc.fontSize(24).fillColor('#2563eb').text('ROWELL', 50, 50);
      doc.fontSize(10).fillColor('#666').text('HPLC Solutions', 50, 80);
      doc.moveDown();

      // Title
      doc.fontSize(18).fillColor('#000').text('QUOTATION', 50, 120);
      doc.fontSize(10).fillColor('#666').text(`Inquiry #${data.inquiry.id}`, 50, 145);
      doc.text(`Date: ${new Date(data.inquiry.createdAt).toLocaleDateString()}`, 50, 160);
      doc.moveDown(2);

      // Customer Information
      doc.fontSize(14).fillColor('#000').text('Customer Information', 50, doc.y);
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333');
      doc.text(`Name: ${data.customer.name}`, 50, doc.y);
      doc.text(`Company: ${data.customer.company}`, 50, doc.y);
      doc.text(`Email: ${data.customer.email}`, 50, doc.y);
      if (data.customer.phone) {
        doc.text(`Phone: ${data.customer.phone}`, 50, doc.y);
      }
      if (data.customer.country) {
        doc.text(`Country: ${data.customer.country}`, 50, doc.y);
      }
      doc.moveDown(2);

      // Inquiry Details
      doc.fontSize(14).fillColor('#000').text('Inquiry Details', 50, doc.y);
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333');
      doc.text(`Status: ${data.inquiry.status.toUpperCase()}`, 50, doc.y);
      doc.text(`Urgency: ${data.inquiry.urgency.toUpperCase()}`, 50, doc.y);
      if (data.inquiry.budgetRange) {
        doc.text(`Budget Range: ${data.inquiry.budgetRange}`, 50, doc.y);
      }
      if (data.inquiry.deliveryAddress) {
        doc.text(`Delivery Address: ${data.inquiry.deliveryAddress}`, 50, doc.y);
      }
      doc.moveDown(2);

      // Products Table
      doc.fontSize(14).fillColor('#000').text('Products', 50, doc.y);
      doc.moveDown(0.5);

      // Table Header
      const tableTop = doc.y;
      doc.fontSize(10).fillColor('#fff');
      doc.rect(50, tableTop, 495, 25).fill('#2563eb');
      doc.fillColor('#fff').text('Product', 60, tableTop + 8);
      doc.text('Qty', 300, tableTop + 8);
      doc.text('Quoted Price', 350, tableTop + 8);
      doc.text('Subtotal', 450, tableTop + 8);

      // Table Rows
      let yPosition = tableTop + 30;
      let totalAmount = 0;

      data.items.forEach((item, index) => {
        const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
        doc.rect(50, yPosition - 5, 495, 25).fill(bgColor);

        doc.fillColor('#333').fontSize(9);
        doc.text(item.product.name || '', 60, yPosition, { width: 230 });
        doc.text(item.quantity.toString(), 300, yPosition);

        if (item.quotedPrice) {
          const price = typeof item.quotedPrice === 'string' ? parseFloat(item.quotedPrice) : item.quotedPrice;
          const subtotal = price * item.quantity;
          totalAmount += subtotal;

          doc.text(`USD ${price.toFixed(2)}`, 350, yPosition);
          doc.text(`USD ${subtotal.toFixed(2)}`, 450, yPosition);
        } else {
          doc.text('TBD', 350, yPosition);
          doc.text('TBD', 450, yPosition);
        }

        yPosition += 25;

        // Add new page if needed
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      });

      // Total
      if (totalAmount > 0) {
        doc.moveDown();
        doc.fontSize(12).fillColor('#000');
        doc.text(`Total: USD ${totalAmount.toFixed(2)}`, 400, yPosition + 10, {
          align: 'right',
        });
      }

      // Customer Notes
      if (data.inquiry.customerNotes) {
        doc.moveDown(2);
        doc.fontSize(12).fillColor('#000').text('Additional Notes:', 50, doc.y);
        doc.fontSize(10).fillColor('#333').text(data.inquiry.customerNotes, 50, doc.y, {
          width: 495,
        });
      }

      // Admin Notes
      if (data.inquiry.adminNotes) {
        doc.moveDown(2);
        doc.fontSize(12).fillColor('#000').text('Admin Notes:', 50, doc.y);
        doc.fontSize(10).fillColor('#333').text(data.inquiry.adminNotes, 50, doc.y, {
          width: 495,
        });
      }

      // Footer
      doc.moveDown(3);
      doc.fontSize(8).fillColor('#666');
      doc.text('ROWELL HPLC Solutions', 50, doc.y, { align: 'center' });
      doc.text('Email: info@rowellhplc.com | WhatsApp: +86 189 3053 9593', 50, doc.y, {
        align: 'center',
      });
      doc.text('Shanghai, China', 50, doc.y, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

