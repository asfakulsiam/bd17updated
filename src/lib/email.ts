
import { Resend } from 'resend'

const resendKey = process.env.RESEND_API_KEY
const fromAddress = 'noreply@bandhan17.site';

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) => {
  if (!resendKey) {
    console.warn('⚠️ RESEND_API_KEY not set. Skipping email.')
    return false
  }
  
  try {
    const resend = new Resend(resendKey)
    const { error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    })

    if (error) {
        console.error({error})
        return false;
    };
    return true
  } catch (err: any) {
    console.error('❌ Failed to send email:', err.message)
    return false
  }
}
