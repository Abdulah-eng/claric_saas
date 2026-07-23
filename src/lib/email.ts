import { Resend } from 'resend'

let resend: Resend | null = null

export function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY!)
  }
  return resend
}

const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'Claric <noreply@claric.io>'

export type SendEmailOptions = {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  attachments?: Array<{
    filename: string
    content: Buffer | string
  }>
}

export async function sendEmail(options: SendEmailOptions) {
  const client = getResend()

  try {
    const result = await client.emails.send({
      from: options.from ?? FROM_ADDRESS,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    })

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('[Email Error]', error)
    return { success: false, error }
  }
}

/**
 * Simple variable substitution for email templates.
 * Replaces {{variable_name}} patterns with provided values.
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return String(variables[key] ?? match)
  })
}
