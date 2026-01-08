const nodemailer = require('nodemailer');

// Cấu hình email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true cho port 465, false cho các port khác
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Gửi email reset password
async function sendResetPasswordEmail(email, resetToken, userName) {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Vietsignschool" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Yêu cầu đặt lại mật khẩu - Vietsignschool',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              padding: 20px;
              background-color: #f9f9f9;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              margin: 20px 0;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background-color: #fff3cd;
              border: 1px solid #ffc107;
              padding: 10px;
              margin: 15px 0;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Đặt lại mật khẩu</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${userName}</strong>,</p>

              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Vietsignschool.</p>

              <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu của bạn:</p>

              <center>
                <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
              </center>

              <p>Hoặc sao chép và dán liên kết sau vào trình duyệt của bạn:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 3px;">
                ${resetUrl}
              </p>

              <div class="warning">
                <strong>⚠️ Lưu ý quan trọng:</strong>
                <ul>
                  <li>Liên kết này chỉ có hiệu lực trong <strong>15 phút</strong></li>
                  <li>Liên kết chỉ có thể sử dụng <strong>một lần</strong></li>
                  <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                </ul>
              </div>

              <div class="footer">
                <p>Trân trọng,<br>Đội ngũ Vietsignschool</p>
                <p style="font-size: 11px; color: #999;">
                  Email này được gửi tự động, vui lòng không trả lời email này.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
  }
}

// Kiểm tra kết nối email
async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}

module.exports = {
  sendResetPasswordEmail,
  verifyEmailConnection
};
