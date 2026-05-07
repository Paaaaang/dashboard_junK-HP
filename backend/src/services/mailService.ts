import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.naver.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.NAVER_USER,
    pass: process.env.NAVER_PASSWORD,
  },
});

interface MailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: any[];
}

export const sendMail = async (options: MailOptions) => {
  const mailOptions = {
    from: `"KHP Dashboard" <${process.env.NAVER_USER}>`,
    to: Array.isArray(options.to) ? options.to.join(',') : options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending mail:', error);
    throw error;
  }
};

/**
 * Replaces placeholders in a string with actual values.
 * Example: "Hello {{name}}" -> "Hello John"
 */
export const replacePlaceholders = (template: string, data: Record<string, string>) => {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, value || '');
  }
  return result;
};
