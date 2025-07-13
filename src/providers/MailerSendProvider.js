
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend'

const mailerSendInstance = new MailerSend({ apiKey: process.env.MAILER_SEND_API_KEY })

const sendFrom = new Sender(process.env.ADMIN_SENDER_EMAIL, process.env.ADMIN_SENDER_NAME)

const sendEmail = async ({ to, toName, subject, html }) => {
  try {
    const recipient = [new Recipient(to, toName)]

    const emailParams = new EmailParams()
      .setFrom(sendFrom)
      .setTo(recipient)
      .setReplyTo(sendFrom)
      .setSubject(subject)
      .setHtml(html)
    const response = await mailerSendInstance.email.send(emailParams)
    return response
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

export const MailerSendProvider = {
  sendEmail
}