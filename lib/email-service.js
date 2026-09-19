import nodemailer from 'nodemailer';

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Password Reset - Stock Master',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your Stock Master account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this password reset, you can safely ignore this email.</p>
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">Stock Master Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

export async function sendVerificationEmail(email, verificationToken) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Verify Your Email - Stock Master',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email Address</h2>
        <p>Hello,</p>
        <p>Thank you for signing up for Stock Master. Please verify your email address to complete your registration.</p>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <p>If you didn't create an account with Stock Master, you can safely ignore this email.</p>
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">Stock Master Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

export async function sendLowStockAlert(lowStockItems) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL || process.env.SMTP_USER, // Send to admin
    subject: `🚨 Low Stock Alert - ${lowStockItems.length} Items Need Reordering`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="background: white; margin: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">⚠️ Stock Alert</h1>
            <p style="color: #fecaca; margin: 8px 0 0 0; font-size: 16px;">Low Stock Items Detected</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0;">Items Need Immediate Attention</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              The following ${lowStockItems.length} items have fallen below their reorder levels and need to be restocked soon:
            </p>
            
            <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #fee2e2;">
                    <th style="padding: 12px; text-align: left; color: #991b1b; font-weight: 600;">Product</th>
                    <th style="padding: 12px; text-align: center; color: #991b1b; font-weight: 600;">SKU</th>
                    <th style="padding: 12px; text-align: center; color: #991b1b; font-weight: 600;">Current Stock</th>
                    <th style="padding: 12px; text-align: center; color: #991b1b; font-weight: 600;">Reorder Level</th>
                    <th style="padding: 12px; text-align: center; color: #991b1b; font-weight: 600;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${lowStockItems.map(item => `
                    <tr style="border-bottom: 1px solid #fca5a5;">
                      <td style="padding: 12px; color: #1f2937; font-weight: 500;">${item.product_name}</td>
                      <td style="padding: 12px; text-align: center; color: #6b7280; font-family: monospace;">${item.product_sku}</td>
                      <td style="padding: 12px; text-align: center;">
                        <span style="background: ${item.current_quantity === 0 ? '#dc2626' : '#f59e0b'}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600;">
                          ${item.current_quantity}
                        </span>
                      </td>
                      <td style="padding: 12px; text-align: center; color: #6b7280;">${item.reorder_level}</td>
                      <td style="padding: 12px; text-align: center;">
                        <span style="background: ${item.current_quantity === 0 ? '#dc2626' : '#f59e0b'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                          ${item.current_quantity === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                📊 Summary: ${lowStockItems.filter(item => item.current_quantity === 0).length} out of stock, ${lowStockItems.filter(item => item.current_quantity > 0).length} low stock
              </p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
                 style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                        color: white; 
                        padding: 16px 32px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        font-size: 16px;
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
                        transition: all 0.3s ease;">
                View Stock Dashboard
              </a>
            </div>
            
            <div style="background: #f9fafb; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; color: #374151; font-size: 14px;">
                <strong>📧 Action Required:</strong> Please review these items and place orders to avoid stockouts.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0;">
              This is an automated alert from Stock Master. Please review inventory levels and take appropriate action.
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
              Stock Master Inventory Management System
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Automated Stock Alert • ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Low stock alert email failed:', error);
    return false;
  }
}
