/**
 * Email service for sending inquiry confirmation emails
 * Supports real SMTP email sending via nodemailer
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface InquiryEmailData {
  inquiryNumber: string;
  userName: string;
  userEmail: string;
  userCompany?: string;
  userPhone?: string;
  userMessage?: string;
  products: Array<{
    name: string;
    partNumber: string;
  }>;
  createdAt: Date;
}

/**
 * SMTP configuration from environment variables
 */
interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

/**
 * Get SMTP configuration from environment variables
 */
function getSMTPConfig(): SMTPConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  // If SMTP is not configured, return null
  if (!host || !port || !user || !pass || !from || !Number.isInteger(Number.parseInt(port, 10))) {
    console.error('[Email Service] SMTP is not configured. Email sending is disabled.');
    console.warn('[Email Service] Required environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM');
    return null;
  }

  return {
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    from,
  };
}

/**
 * Create email transporter
 */
let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) {
    return transporter;
  }

  const config = getSMTPConfig();
  if (!config) {
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    console.log('[Email Service] SMTP transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('[Email Service] Failed to create SMTP transporter:', error);
    return null;
  }
}

/**
 * Generate HTML email content for inquiry confirmation
 */
function generateInquiryEmailHTML(data: InquiryEmailData): string {
  const productRows = data.products
    .map((p, index) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${p.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${p.partNumber}</td>
      </tr>
    `)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>询价确认</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Rowell HPLC 产品中心</h1>
    <p style="margin: 10px 0 0 0; font-size: 14px;">专业的 HPLC 色谱柱供应商</p>
  </div>
  
  <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #2563eb; margin-top: 0;">询价确认</h2>
    
    <p>尊敬的 <strong>${data.userName}</strong>，</p>
    
    <p>感谢您对 Rowell HPLC 的关注！您的询价已成功提交，我们将尽快与您联系。</p>
    
    <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
      <p style="margin: 5px 0;"><strong>询价单号:</strong> ${data.inquiryNumber}</p>
      <p style="margin: 5px 0;"><strong>提交时间:</strong> ${data.createdAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
      ${data.userCompany ? `<p style="margin: 5px 0;"><strong>公司:</strong> ${data.userCompany}</p>` : ''}
      ${data.userPhone ? `<p style="margin: 5px 0;"><strong>电话:</strong> ${data.userPhone}</p>` : ''}
    </div>
    
    <h3 style="color: #2563eb; margin-top: 20px;">询价产品</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 10px 0; background-color: white;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left; width: 50px;">#</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">产品名称</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">货号</th>
        </tr>
      </thead>
      <tbody>
        ${productRows}
      </tbody>
    </table>
    
    ${data.userMessage ? `
    <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <h3 style="color: #2563eb; margin-top: 0;">您的留言</h3>
      <p style="margin: 0; white-space: pre-wrap;">${data.userMessage}</p>
    </div>
    ` : ''}
    
    <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0;"><strong>⏰ 响应时间:</strong> 我们的销售团队将在 1-2 个工作日内与您联系。</p>
    </div>
    
    <h3 style="color: #2563eb; margin-top: 20px;">联系我们</h3>
    <p style="margin: 5px 0;">📧 邮箱: <a href="mailto:sales@rowellhplc.com" style="color: #2563eb;">sales@rowellhplc.com</a></p>
    <p style="margin: 5px 0;">📞 电话: +86 XXX-XXXX-XXXX</p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    
    <p style="color: #6b7280; font-size: 12px; margin: 0;">
      此邮件由系统自动发送，请勿直接回复。如有问题，请通过上述联系方式与我们联系。
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
    <p style="margin: 5px 0;">© 2026 Rowell HPLC 产品中心. All rights reserved.</p>
    <p style="margin: 5px 0;">专业的 HPLC 色谱柱供应商，提供高质量的分析解决方案</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email content for inquiry confirmation
 */
function generateInquiryEmailText(data: InquiryEmailData): string {
  const productList = data.products
    .map((p, index) => `${index + 1}. ${p.name} (货号: ${p.partNumber})`)
    .join('\n');

  return `
尊敬的 ${data.userName}，

感谢您对 Rowell HPLC 的关注！

您的询价已成功提交，我们将尽快与您联系。

询价单号: ${data.inquiryNumber}
提交时间: ${data.createdAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
${data.userCompany ? `公司: ${data.userCompany}\n` : ''}${data.userPhone ? `电话: ${data.userPhone}\n` : ''}
询价产品:
${productList}

${data.userMessage ? `您的留言:\n${data.userMessage}\n\n` : ''}我们的销售团队将在 1-2 个工作日内与您联系。

如有任何问题，请随时联系我们：
邮箱: sales@rowellhplc.com
电话: +86 XXX-XXXX-XXXX

祝好！
Rowell HPLC 团队

---
此邮件由系统自动发送，请勿直接回复。
© 2026 Rowell HPLC 产品中心. All rights reserved.
  `.trim();
}

/**
 * Send inquiry confirmation email
 * @param data Inquiry email data
 * @returns Promise<boolean> true if email sent successfully, false otherwise
 */
export async function sendInquiryEmail(data: InquiryEmailData): Promise<boolean> {
  try {
    const transporter = getTransporter();
    
    // Never treat a missing SMTP configuration as a successful delivery and
    // never write customer inquiry contents to application logs.
    if (!transporter) {
      console.error('[Email Service] SMTP not configured; inquiry confirmation was not sent.');
      return false;
    }

    const config = getSMTPConfig();
    if (!config) {
      return false;
    }

    // Send email using nodemailer
    const info = await transporter.sendMail({
      from: `"Rowell HPLC 产品中心" <${config.from}>`,
      to: data.userEmail,
      subject: `您的询价已提交 - 询价单号: ${data.inquiryNumber}`,
      text: generateInquiryEmailText(data),
      html: generateInquiryEmailHTML(data),
    });

    console.log('[Email Service] Email sent successfully:', info.messageId);
    console.log('[Email Service] Preview URL:', nodemailer.getTestMessageUrl(info));
    
    return true;
  } catch (error) {
    console.error('[Email Service] Failed to send inquiry email:', error);
    return false;
  }
}

/**
 * Verify SMTP connection
 * @returns Promise<boolean> true if connection is successful, false otherwise
 */
export async function verifySMTPConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    
    if (!transporter) {
      console.warn('[Email Service] SMTP not configured. Cannot verify connection.');
      return false;
    }

    await transporter.verify();
    console.log('[Email Service] SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('[Email Service] SMTP connection verification failed:', error);
    return false;
  }
}
