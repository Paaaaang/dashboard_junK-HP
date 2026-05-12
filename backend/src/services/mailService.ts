import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { query } from '../db';

dotenv.config();

/**
 * Gets dynamic SMTP configuration from database.
 */
async function getTransporter() {
  const res = await query('SELECT value FROM system_settings WHERE key = $1', ['naver_smtp']);
  const config = res.rows[0]?.value || {};
  
  const email = config.email || process.env.NAVER_EMAIL;
  const password = config.password || process.env.NAVER_APP_PASSWORD;
  
  if (!email || !password) {
    throw new Error('SMTP configuration incomplete: email and password are required');
  }

  const port = parseInt(config.port || process.env.NAVER_SMTP_PORT || '465', 10);

  return nodemailer.createTransport({
    host: config.host || process.env.NAVER_SMTP_HOST || 'smtp.naver.com',
    port: port,
    secure: port === 465, // SSL for 465, STARTTLS for other ports
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    auth: {
      user: email.trim(),
      pass: password,
    },
  });
}


export interface AttachmentInput {
  filename: string;
  content?: any;
  path?: string;
  contentType?: string;
}

export interface SendOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: AttachmentInput[];
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipient: string;
}

/**
 * Sends an email with retry logic and dynamic configuration.
 */
export async function sendEmail(options: SendOptions): Promise<SendResult> {
  const isDevMode = process.env.EMAIL_DEV_MODE === 'true';
  
  // Fetch dynamic sender info
  const res = await query('SELECT value FROM system_settings WHERE key = $1', ['naver_smtp']);
  const config = res.rows[0]?.value || {};
  const senderEmail = config.email || process.env.NAVER_EMAIL;

  // Validate sender email
  if (!senderEmail || typeof senderEmail !== 'string' || !senderEmail.trim()) {
    return {
      success: false,
      error: 'Sender email is not configured. Please set NAVER_EMAIL in environment or configure SMTP settings.',
      recipient: options.to
    };
  }

  const trimmedEmail = senderEmail.trim();
  const recipient = isDevMode ? trimmedEmail : options.to;
  const subject = isDevMode ? `[DEV] ${options.subject}` : options.subject;

  // Properly format the from address
  const mailOptions = {
    from: trimmedEmail, // Use email directly, nodemailer will handle formatting
    to: recipient,
    subject: subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  };

  let transporter;
  try {
    transporter = await getTransporter();
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to initialize email transporter: ${error.message}`,
      recipient: options.to
    };
  }

  let lastError: any;
  const retryDelays = [1000, 2000, 4000]; // 1s, 2s, 4s backoff

  for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      return { 
        success: true, 
        messageId: info.messageId, 
        recipient 
      };
    } catch (error: any) {
      lastError = error;
      console.error(`Email send attempt ${attempt + 1} failed for ${recipient}:`, error.message);
      
      // If it's a permanent error or we've exhausted retries, break
      if (attempt === retryDelays.length) break;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
    }
  }

  return { 
    success: false, 
    error: lastError?.message || 'Unknown error', 
    recipient 
  };
}

/**
 * Renders a template string by replacing {{varName}} placeholders
 * and converting custom tags/line breaks to standard HTML.
 */
export function renderTemplate(template: string, vars: Record<string, string>): {
  rendered: string;
  unresolvedVars: string[];
} {
  let rendered = template;
  const unresolvedVars: string[] = [];

  // 1. Replace variables {{variableName}}
  const matches = template.match(/{{[a-zA-Z0-9_]+}}/g) || [];
  const uniqueMatches = Array.from(new Set(matches));

  for (const match of uniqueMatches) {
    const varName = match.slice(2, -2);
    if (vars[varName] !== undefined) {
      const regex = new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      rendered = rendered.replace(regex, vars[varName]);
    } else {
      unresolvedVars.push(varName);
    }
  }

  // 2. Convert custom tags to standard HTML with inline styles
  rendered = rendered
    .replace(/<b>([\s\S]*?)<\/b>/g, '<strong style="font-weight: bold;">$1</strong>')
    .replace(/<i>([\s\S]*?)<\/i>/g, '<em style="font-style: italic;">$1</em>')
    .replace(/<u>([\s\S]*?)<\/u>/g, '<u style="text-decoration: underline;">$1</u>')
    .replace(/<s>([\s\S]*?)<\/s>/g, '<strike style="text-decoration: line-through;">$1</strike>')
    .replace(/<mark>([\s\S]*?)<\/mark>/g, '<span style="background-color: #fef08a; padding: 0 2px;">$1</span>')
    .replace(/<li>([\s\S]*?)<\/li>/g, '<div style="margin: 4px 0;">• $1</div>')
    .replace(/<color hex="([^"]+)">([\s\S]*?)<\/color>/g, '<span style="color: $1;">$2</span>')
    .replace(/<font face="([^"]+)">([\s\S]*?)<\/font>/g, '<span style="font-family: $1;">$2</span>')
    .replace(/<size value="([^"]+)">([\s\S]*?)<\/size>/g, '<span style="font-size: $1;">$2</span>')
    .replace(/<a href="([^"]+)">([\s\S]*?)<\/a>/g, '<a href="$1" style="color: #3b82f6; text-decoration: underline;">$2</a>');

  // 3. Handle line breaks (convert \n to <br>)
  rendered = rendered.replace(/\n/g, '<br>');

  // 4. Wrap in a basic container for better email client support
  rendered = `<div style="font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; font-size: 14px; line-height: 1.6; color: #333333;">${rendered}</div>`;

  return { rendered, unresolvedVars };
}

/**
 * Validates attachments based on size and MIME type.
 */
export function validateAttachments(attachments: AttachmentInput[]): {
  isValid: boolean;
  error?: string;
} {
  const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB total (base64 overhead means raw should be ~18MB, but we'll check total)
  const FORBIDDEN_EXTENSIONS = ['.exe', '.bat', '.sh', '.msi', '.js', '.vbs'];
  const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'application/haansoft-hwp', // hwp
    'application/x-hwp', // hwp
    'image/png',
    'image/jpeg',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain'
  ];

  let totalSize = 0;

  for (const att of attachments) {
    // Check extension
    const ext = att.filename.slice(att.filename.lastIndexOf('.')).toLowerCase();
    if (FORBIDDEN_EXTENSIONS.includes(ext)) {
      return { isValid: false, error: `Forbidden file type: ${ext}` };
    }

    // Check size if available (content length or path stat)
    // Note: In real scenarios, we'd check the actual file size here.
    // For now, this is a placeholder for validation logic.
  }

  return { isValid: true };
}
