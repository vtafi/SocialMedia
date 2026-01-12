import { Resend } from 'resend'
import { config } from 'dotenv'
import {
  getPasswordResetEmailTemplate,
  getVerificationEmailTemplate,
  getWelcomeEmailTemplate
} from '~/utils/email.templates'

config()

const resend = new Resend(process.env.RESEND_API_KEY)

export const EmailService = {
  /**
   * Send email verification email
   */
  async sendVerificationEmail({
    to,
    name,
    verificationToken
  }: {
    to: string
    name: string
    verificationToken: string
  }) {
    try {
      const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'
      const verificationLink = `${CLIENT_URL}/verify-email?token=${verificationToken}`

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: [to],
        subject: '✉️ Xác thực Email - Twitter Clone',
        html: getVerificationEmailTemplate({ name, verificationLink })
      })

      if (error) {
        console.error('❌ Failed to send verification email:', error)
        throw error
      }

      console.log('✅ Verification email sent successfully:', data)
      return data
    } catch (error) {
      console.error('❌ Email service error:', error)
      // Don't throw error to prevent registration flow from failing
      // Just log the error and continue
      return null
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail({ to, name, resetToken }: { to: string; name: string; resetToken: string }) {
    try {
      const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'
      const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}`

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: [to],
        subject: '🔐 Reset Mật Khẩu - Twitter Clone',
        html: getPasswordResetEmailTemplate({ name, resetLink })
      })

      if (error) {
        console.error('❌ Failed to send password reset email:', error)
        throw error
      }

      console.log('✅ Password reset email sent successfully:', data)
      return data
    } catch (error) {
      console.error('❌ Email service error:', error)
      return null
    }
  },

  /**
   * Send welcome email after verification (optional)
   */
  async sendWelcomeEmail({ to, name }: { to: string; name: string }) {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: [to],
        subject: '🎉 Chào mừng đến Twitter Clone!',
        html: getWelcomeEmailTemplate({ name })
      })

      if (error) {
        console.error('❌ Failed to send welcome email:', error)
        throw error
      }

      console.log('✅ Welcome email sent successfully:', data)
      return data
    } catch (error) {
      console.error('❌ Email service error:', error)
      return null
    }
  }
}
