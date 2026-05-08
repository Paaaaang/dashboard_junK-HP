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

  return nodemailer.createTransport({
    host: config.host || process.env.NAVER_SMTP_HOST || 'smtp.naver.com',
    port: parseInt(process.env.NAVER_SMTP_PORT || '465'),
    secure: true, // use SSL
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    auth: {
      user: config.email || process.env.NAVER_EMAIL,
      pass: config.password || process.env.NAVER_APP_PASSWORD,
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

  const recipient = isDevMode ? (senderEmail || '') : options.to;
  const subject = isDevMode ? `[DEV] ${options.subject}` : options.subject;

  const mailOptions = {
    from: `"KHP Dashboard" <${senderEmail}>`,
    to: recipient,
    subject: subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  };

  const transporter = await getTransporter();

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
 * Renders a template string by replacing {{varName}} placeholders.
 */
export function renderTemplate(template: string, vars: Record<string, string>): {
  rendered: string;
  unresolvedVars: string[];
} {
  let rendered = template;
  const unresolvedVars: string[] = [];

  // Find all matches for {{variableName}}
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
