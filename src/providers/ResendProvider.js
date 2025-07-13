import { Resend } from 'resend'

const resendInstance = new Resend(process.env.RESEND_API_KEY)

const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await resendInstance.emails.send({
      from: process.env.ADMIN_EMAIL,
      to,
      subject,
      html
    })
    return response
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

export const ResendProvider = {
  sendEmail
}
