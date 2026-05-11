import { query } from '../db';
import { sendEmail, renderTemplate, SendOptions } from './mailService';
import { v4 as uuidv4 } from 'uuid';

interface Recipient {
  id?: string;
  email: string;
  variables: Record<string, string>;
}

interface EmailJob {
  id: string;
  templateId: string;
  recipients: Recipient[];
  status: 'queued' | 'running' | 'completed' | 'failed';
  totalCount: number;
  sentCount: number;
  failedCount: number;
}

const activeJobs: Map<string, EmailJob> = new Map();

/**
 * Enqueues a batch of emails for background processing.
 */
export async function enqueueBatch(
  templateId: string,
  recipients: Recipient[],
  createdBy: string
): Promise<string> {
  const jobId = uuidv4();
  
  // 1. Create Job in DB
  await query(
    'INSERT INTO email_jobs (id, template_id, total_count, status, created_by) VALUES ($1, $2, $3, $4, $5)',
    [jobId, templateId, recipients.length, 'queued', createdBy]
  );

  const job: EmailJob = {
    id: jobId,
    templateId,
    recipients,
    status: 'queued',
    totalCount: recipients.length,
    sentCount: 0,
    failedCount: 0,
  };

  activeJobs.set(jobId, job);

  // 2. Start processing in background (non-blocking)
  processQueue(jobId).catch(err => {
    console.error(`Critical error in job ${jobId}:`, err);
  });

  return jobId;
}

/**
 * Process the queue in chunks with intervals.
 */
async function processQueue(jobId: string) {
  const job = activeJobs.get(jobId);
  if (!job) return;

  // Update status to running
  job.status = 'running';
  await query('UPDATE email_jobs SET status = $1 WHERE id = $2', ['running', jobId]);

  // Fetch template details
  const tempRes = await query('SELECT * FROM email_templates WHERE id = $1', [job.templateId]);
  if (tempRes.rowCount === 0) {
    job.status = 'failed';
    await query('UPDATE email_jobs SET status = $1 WHERE id = $2', ['failed', jobId]);
    return;
  }
  const template = tempRes.rows[0];

  const CHUNK_SIZE = 10;
  const INTERVAL_MS = 1500;

  for (let i = 0; i < job.recipients.length; i += CHUNK_SIZE) {
    const chunk = job.recipients.slice(i, i + CHUNK_SIZE);
    
    // Process chunk in parallel
    const results = await Promise.all(chunk.map(async (recipient) => {
      const { rendered: body } = renderTemplate(template.body, recipient.variables);
      const { rendered: subject } = renderTemplate(template.subject || '', recipient.variables);

      const sendOptions: SendOptions = {
        to: recipient.email,
        subject: subject || template.name,
        text: body.replace(/<[^>]*>?/gm, ''),
        html: body,
        attachments: template.attachments // Template attachments are passed here
      };

      const result = await sendEmail(sendOptions);

      // Log to DB
      await query(
        `INSERT INTO email_logs 
         (job_id, template_id, sender_email, recipient_email, subject, body_rendered, status, error_message, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          jobId, 
          job.templateId, 
          process.env.NAVER_EMAIL, 
          recipient.email, 
          sendOptions.subject, 
          body, 
          result.success ? 'sent' : 'failed',
          result.error || null,
          result.success ? new Date() : null
        ]
      );

      return result.success;
    }));

    // Update counts
    const successCount = results.filter(r => r).length;
    const failureCount = results.length - successCount;

    job.sentCount += successCount;
    job.failedCount += failureCount;

    // Update DB
    await query(
      'UPDATE email_jobs SET sent_count = $1, failed_count = $2 WHERE id = $3',
      [job.sentCount, job.failedCount, jobId]
    );

    // Wait if not last chunk
    if (i + CHUNK_SIZE < job.recipients.length) {
      await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
    }
  }

  // Final update
  job.status = 'completed';
  await query(
    'UPDATE email_jobs SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2',
    ['completed', jobId]
  );
  activeJobs.delete(jobId);
}

/**
 * Get current status of a job.
 */
export async function getJobStatus(jobId: string) {
  const res = await query('SELECT * FROM email_jobs WHERE id = $1', [jobId]);
  return res.rows[0];
}
