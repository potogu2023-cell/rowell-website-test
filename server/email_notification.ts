import nodemailer from 'nodemailer';

// 邮件配置
const EMAIL_CONFIG = {
  // 使用环境变量配置SMTP
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// 收件人邮箱
const RECIPIENT_EMAIL = 'oscar@rowellhplc.com';

// 创建邮件传输器
const createTransporter = () => {
  try {
    return nodemailer.createTransporter(EMAIL_CONFIG);
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
};

// 发送客户留言/询价通知邮件
export async function sendCustomerMessageNotification(data: {
  type: 'inquiry' | 'message' | 'quote_request';
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  productId?: string;
  productName?: string;
  productPartNumber?: string;
}) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error('Email transporter not configured');
    return { success: false, error: 'Email service not configured' };
  }

  // 根据类型确定邮件主题
  const typeLabels = {
    inquiry: '产品询价',
    message: '客户留言',
    quote_request: '报价请求',
  };
  
  const typeLabel = typeLabels[data.type] || '客户消息';
  
  // 构建邮件内容
  const subject = `[ROWELL网站] 新${typeLabel} - ${data.name}`;
  
  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
        新${typeLabel}通知
      </h2>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">客户信息</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 100px;"><strong>姓名:</strong></td>
            <td style="padding: 8px 0;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;"><strong>邮箱:</strong></td>
            <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #2563eb;">${data.email}</a></td>
          </tr>
          ${data.phone ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;"><strong>电话:</strong></td>
            <td style="padding: 8px 0;">${data.phone}</td>
          </tr>
          ` : ''}
          ${data.company ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;"><strong>公司:</strong></td>
            <td style="padding: 8px 0;">${data.company}</td>
          </tr>
          ` : ''}
        </table>
      </div>
  `;

  // 如果是产品相关的消息，添加产品信息
  if (data.productId) {
    htmlContent += `
      <div style="background-color: #eff6ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <h3 style="margin-top: 0; color: #1e40af;">产品信息</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 100px;"><strong>产品ID:</strong></td>
            <td style="padding: 8px 0;">${data.productId}</td>
          </tr>
          ${data.productPartNumber ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;"><strong>Part Number:</strong></td>
            <td style="padding: 8px 0;">${data.productPartNumber}</td>
          </tr>
          ` : ''}
          ${data.productName ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;"><strong>产品名称:</strong></td>
            <td style="padding: 8px 0;">${data.productName}</td>
          </tr>
          ` : ''}
        </table>
      </div>
    `;
  }

  // 添加留言内容
  htmlContent += `
      <div style="background-color: #ffffff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">${data.type === 'inquiry' ? '客户需求' : '留言内容'}</h3>
        <p style="white-space: pre-wrap; line-height: 1.6; color: #4b5563;">${data.message}</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
        <p>此邮件由ROWELL网站自动发送，请勿直接回复。</p>
        <p>如需回复客户，请使用客户提供的邮箱地址: <a href="mailto:${data.email}" style="color: #2563eb;">${data.email}</a></p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"ROWELL网站" <${EMAIL_CONFIG.auth.user}>`,
      to: RECIPIENT_EMAIL,
      subject: subject,
      html: htmlContent,
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}
