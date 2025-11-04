import ExcelJS from 'exceljs';
import { getDb } from './db';
import { sql, eq, and, desc } from 'drizzle-orm';

/**
 * Generate monthly statistics report
 */
export async function generateMonthlyReport(year: number, month: number): Promise<Buffer> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { inquiries, users, inquiryItems, products } = await import('../drizzle/schema');

  // Calculate date range for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Fetch statistics
  const totalInquiriesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(inquiries)
    .where(and(
      sql`${inquiries.createdAt} >= ${startDate.toISOString()}`,
      sql`${inquiries.createdAt} <= ${endDate.toISOString()}`
    ));
  const totalInquiries = Number(totalInquiriesResult[0]?.count || 0);

  const byStatusResult = await db
    .select({
      status: inquiries.status,
      count: sql<number>`count(*)`,
    })
    .from(inquiries)
    .where(and(
      sql`${inquiries.createdAt} >= ${startDate.toISOString()}`,
      sql`${inquiries.createdAt} <= ${endDate.toISOString()}`
    ))
    .groupBy(inquiries.status);

  const newCustomersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(
      eq(users.role, 'user'),
      sql`${users.createdAt} >= ${startDate.toISOString()}`,
      sql`${users.createdAt} <= ${endDate.toISOString()}`
    ));
  const newCustomers = Number(newCustomersResult[0]?.count || 0);

  const topProductsResult = await db
    .select({
      productName: products.name,
      brand: products.brand,
      partNumber: products.partNumber,
      count: sql<number>`count(*)`,
    })
    .from(inquiryItems)
    .leftJoin(products, eq(inquiryItems.productId, products.id))
    .leftJoin(inquiries, eq(inquiryItems.inquiryId, inquiries.id))
    .where(and(
      sql`${inquiries.createdAt} >= ${startDate.toISOString()}`,
      sql`${inquiries.createdAt} <= ${endDate.toISOString()}`
    ))
    .groupBy(products.id, products.name, products.brand, products.partNumber)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Monthly Report');

  // Set column widths
  worksheet.columns = [
    { width: 30 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
  ];

  // Header
  worksheet.mergeCells('A1:D1');
  const titleRow = worksheet.getCell('A1');
  titleRow.value = `ROWELL HPLC - Monthly Report (${year}-${String(month).padStart(2, '0')})`;
  titleRow.font = { size: 16, bold: true };
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Summary Section
  worksheet.addRow([]);
  worksheet.addRow(['SUMMARY']);
  worksheet.getCell('A3').font = { bold: true, size: 14 };
  worksheet.addRow(['Report Period:', `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`]);
  worksheet.addRow(['Total Inquiries:', totalInquiries]);
  worksheet.addRow(['New Customers:', newCustomers]);
  worksheet.addRow([]);

  // Inquiry Status Breakdown
  worksheet.addRow(['INQUIRY STATUS BREAKDOWN']);
  worksheet.getCell(`A${worksheet.lastRow!.number}`).font = { bold: true, size: 14 };
  
  const statusHeaderRow = worksheet.addRow(['Status', 'Count', 'Percentage', '']);
  statusHeaderRow.eachCell((cell, colNumber) => {
    if (colNumber <= 3) {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  });

  byStatusResult.forEach(status => {
    const count = Number(status.count);
    const percentage = totalInquiries > 0 ? (count / totalInquiries * 100).toFixed(1) : '0';
    const row = worksheet.addRow([
      status.status.toUpperCase(),
      count,
      `${percentage}%`,
      ''
    ]);
    row.eachCell((cell, colNumber) => {
      if (colNumber <= 3) {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });
  });

  worksheet.addRow([]);

  // Top Products
  worksheet.addRow(['TOP 10 PRODUCTS']);
  worksheet.getCell(`A${worksheet.lastRow!.number}`).font = { bold: true, size: 14 };
  
  const productHeaderRow = worksheet.addRow(['Rank', 'Brand', 'Part Number', 'Inquiries']);
  productHeaderRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  topProductsResult.forEach((product, index) => {
    const row = worksheet.addRow([
      index + 1,
      product.brand || 'N/A',
      product.partNumber || 'N/A',
      Number(product.count)
    ]);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Footer
  worksheet.addRow([]);
  worksheet.addRow([]);
  const footerRow = worksheet.addRow(['Generated by ROWELL HPLC Analytics System']);
  footerRow.getCell(1).font = { italic: true, size: 10 };
  footerRow.getCell(1).alignment = { horizontal: 'center' };
  worksheet.mergeCells(`A${footerRow.number}:D${footerRow.number}`);

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Send monthly report email to admin
 * This is a business notification email (not marketing)
 */
export async function sendMonthlyReport(year: number, month: number): Promise<boolean> {
  try {
    const sgMail = (await import('@sendgrid/mail')).default;
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@rowellhplc.com';
    const toEmail = 'info@rowellhplc.com';

    if (!apiKey) {
      console.warn('[Email] SENDGRID_API_KEY not configured, skipping monthly report email');
      return false;
    }

    // Generate report
    const reportBuffer = await generateMonthlyReport(year, month);
    console.log(`[Report] Monthly report generated (${reportBuffer.length} bytes)`);

    sgMail.setApiKey(apiKey);

    const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' });

    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: `ROWELL HPLC - Monthly Report (${monthName} ${year})`,
      text: `
Monthly Report for ${monthName} ${year}

Please find attached the monthly statistics report for ROWELL HPLC.

This report includes:
- Total inquiries and new customers
- Inquiry status breakdown
- Top 10 most inquired products

Best regards,
ROWELL HPLC Analytics System
      `,
      html: `
<h2>Monthly Report - ${monthName} ${year}</h2>
<p>Please find attached the monthly statistics report for ROWELL HPLC.</p>

<h3>Report Contents</h3>
<ul>
  <li>Total inquiries and new customers</li>
  <li>Inquiry status breakdown</li>
  <li>Top 10 most inquired products</li>
</ul>

<p>Best regards,<br>
<strong>ROWELL HPLC Analytics System</strong></p>
      `,
      attachments: [
        {
          content: reportBuffer.toString('base64'),
          filename: `monthly-report-${year}-${String(month).padStart(2, '0')}.xlsx`,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          disposition: 'attachment',
        },
      ],
    };

    await sgMail.send(msg);
    console.log(`[Email] Monthly report sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send monthly report:', error);
    return false;
  }
}

/**
 * Cron job handler for monthly report
 * Should be called on the 2nd of each month
 */
export async function monthlyReportCronJob(): Promise<void> {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  const year = lastMonth.getFullYear();
  const month = lastMonth.getMonth() + 1;

  console.log(`[Monthly Report] Generating report for ${year}-${month}...`);
  
  try {
    await sendMonthlyReport(year, month);
    console.log(`[Monthly Report] ✅ Report generated and sent successfully`);
  } catch (error) {
    console.error(`[Monthly Report] ❌ Failed to generate report:`, error);
  }
}

