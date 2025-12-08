import { MediaType } from '~/constants/enum'

/**
 * Email template for email verification
 */
export const getVerificationEmailTemplate = ({
  name,
  verificationLink
}: {
  name: string
  verificationLink: string
}) => {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác thực Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1DA1F2 0%, #0d8bd9 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🐦 Twitter Clone</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Xin chào ${name}!</h2>
                  <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                    Cảm ơn bạn đã đăng ký tài khoản. Vui lòng xác thực email của bạn để hoàn tất quá trình đăng ký.
                  </p>
                  <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                    Click vào nút bên dưới để xác thực email:
                  </p>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${verificationLink}" 
                           style="display: inline-block; padding: 16px 40px; background-color: #1DA1F2; color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(29, 161, 242, 0.3);">
                          Xác thực Email
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                    Hoặc copy link này vào trình duyệt:<br>
                    <a href="${verificationLink}" style="color: #1DA1F2; word-break: break-all;">${verificationLink}</a>
                  </p>
                  
                  <p style="margin: 20px 0 0 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; color: #856404; font-size: 14px; border-radius: 4px;">
                    ⚠️ Link này sẽ hết hạn sau <strong>24 giờ</strong>.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px;">
                    Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.
                  </p>
                  <p style="margin: 0; color: #999999; font-size: 12px;">
                    © 2024 Twitter Clone. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Email template for password reset
 */
export const getPasswordResetEmailTemplate = ({ name, resetLink }: { name: string; resetLink: string }) => {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Mật Khẩu</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🔐 Reset Mật Khẩu</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Xin chào ${name}!</h2>
                  <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                    Chúng tôi nhận được yêu cầu reset mật khẩu cho tài khoản của bạn.
                  </p>
                  <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                    Click vào nút bên dưới để tạo mật khẩu mới:
                  </p>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${resetLink}" 
                           style="display: inline-block; padding: 16px 40px; background-color: #dc3545; color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);">
                          Reset Mật Khẩu
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 30px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                    Hoặc copy link này vào trình duyệt:<br>
                    <a href="${resetLink}" style="color: #dc3545; word-break: break-all;">${resetLink}</a>
                  </p>
                  
                  <p style="margin: 20px 0 0 0; padding: 15px; background-color: #f8d7da; border-left:4px solid #dc3545; color: #721c24; font-size: 14px; border-radius: 4px;">
                    ⚠️ Link này sẽ hết hạn sau <strong>15 phút</strong> vì lý do bảo mật.
                  </p>
                  
                  <p style="margin: 20px 0 0 0; padding: 15px; background-color: #d1ecf1; border-left: 4px solid #0c5460; color: #0c5460; font-size: 14px; border-radius: 4px;">
                    ℹ️ Nếu bạn không yêu cầu reset mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px;">
                    Để bảo mật tài khoản, không chia sẻ link này với bất kỳ ai.
                  </p>
                  <p style="margin: 0; color: #999999; font-size: 12px;">
                    © 2024 Twitter Clone. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Email template for welcome email (optional)
 */
export const getWelcomeEmailTemplate = ({ name }: { name: string }) => {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chào mừng!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #28a745 0%, #20853a 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🎉 Chào mừng đến Twitter Clone!</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Chào ${name}!</h2>
                  <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                    Chúc mừng! Email của bạn đã được xác thực thành công. 
                  </p>
                  <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                    Bây giờ bạn có thể:
                  </p>
                  
                  <ul style="color: #666666; font-size: 16px; line-height: 1.8; padding-left: 20px;">
                    <li>Đăng tweets và chia sẻ suy nghĩ của bạn</li>
                    <li>Follow những người bạn quan tâm</li>
                    <li>Like và comment trên các tweets</li>
                    <li>Upload ảnh và video</li>
                    <li>Nhắn tin với bạn bè</li>
                  </ul>
                  
                  <p style="margin: 30px 0 0 0; color: #666666; font-size: 16px; line-height: 1.6;">
                    Hãy bắt đầu hành trình của bạn ngay hôm nay! 🚀
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0; color: #999999; font-size: 12px;">
                    © 2024 Twitter Clone. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
