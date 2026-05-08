import { Router, Request, Response } from 'express';
import { query } from '../db';
import { renderTemplate, sendEmail, validateAttachments } from '../services/mailService';
import { enqueueBatch, getJobStatus } from '../services/emailQueue';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads/email-attachments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

/**
 * Middleware: Simple Admin Auth (Placeholder or check for secret header)
 */
const adminAuth = (req: Request, res: Response, next: any) => {
  // For now, we allow all if no specific auth logic is requested, 
  // but we can check for a custom header if needed.
  next();
};

/**
 * POST /api/v1/emails/preview
 * Preview template rendering with sample variables.
 */
router.post('/preview', adminAuth, async (req: Request, res: Response) => {
  const { template, variables } = req.body;
  try {
    const { rendered, unresolvedVars } = renderTemplate(template, variables);
    res.json({ rendered, unresolvedVars });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/emails/test
 * Send a single test email (synchronous).
 */
router.post('/test', adminAuth, async (req: Request, res: Response) => {
  const { to, subject, body, attachments = [] } = req.body;
  try {
    const result = await sendEmail({
      to,
      subject,
      text: body,
      attachments
    });
    
    // Log test attempt
    await query(
      'INSERT INTO email_logs (sender_email, recipient_email, subject, body_rendered, status, error_message) VALUES ($1, $2, $3, $4, $5, $6)',
      [process.env.NAVER_EMAIL, to, subject, body, result.success ? 'sent' : 'failed', result.error || null]
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/emails/send
 * Batch send emails (asynchronous, returns jobId).
 */
router.post('/send', adminAuth, async (req: Request, res: Response) => {
  const { templateId, recipients, createdBy } = req.body;
  
  if (!templateId || !recipients || !Array.isArray(recipients)) {
    return res.status(400).json({ error: 'Invalid request: templateId and recipients array required' });
  }

  try {
    const jobId = await enqueueBatch(templateId, recipients, createdBy || 'admin');
    res.status(202).json({ jobId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/emails/jobs/:jobId
 * Get progress of a batch job.
 */
router.get('/jobs/:jobId', adminAuth, async (req: Request, res: Response) => {
  try {
    const job = await getJobStatus(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/emails/logs
 * Get email logs with pagination.
 */
router.get('/logs', adminAuth, async (req: Request, res: Response) => {
  const { limit = 50, offset = 0, status, templateId } = req.query;
  try {
    let sql = `
      SELECT el.*, et.name as template_name, ej.status as job_status
      FROM email_logs el
      LEFT JOIN email_templates et ON et.id = el.template_id
      LEFT JOIN email_jobs ej ON ej.id = el.job_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      params.push(status);
      sql += ` AND el.status = $${params.length}`;
    }
    if (templateId) {
      params.push(templateId);
      sql += ` AND el.template_id = $${params.length}`;
    }

    sql += ` ORDER BY el.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/emails/templates/:id/attachments
 * Upload attachment for a template.
 */
router.post('/templates/:id/attachments', adminAuth, upload.single('file'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    // 1. Fetch current template
    const tempRes = await query('SELECT attachments FROM email_templates WHERE id = $1', [id]);
    if (tempRes.rowCount === 0) return res.status(404).json({ error: 'Template not found' });
    
    const attachments = tempRes.rows[0].attachments || [];
    const newAttachment = {
      id: Date.now().toString(),
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      path: file.path
    };

    attachments.push(newAttachment);

    // 2. Update template
    await query('UPDATE email_templates SET attachments = $1 WHERE id = $2', [JSON.stringify(attachments), id]);

    res.json(newAttachment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/v1/emails/templates/:id/attachments/:attachmentId
 * Delete an attachment.
 */
router.delete('/templates/:id/attachments/:attachmentId', adminAuth, async (req: Request, res: Response) => {
  const { id, attachmentId } = req.params;

  try {
    const tempRes = await query('SELECT attachments FROM email_templates WHERE id = $1', [id]);
    if (tempRes.rowCount === 0) return res.status(404).json({ error: 'Template not found' });

    let attachments = tempRes.rows[0].attachments || [];
    const attachmentToDelete = attachments.find((a: any) => a.id === attachmentId);

    if (attachmentToDelete) {
      // Remove file from disk
      if (fs.existsSync(attachmentToDelete.path)) {
        fs.unlinkSync(attachmentToDelete.path);
      }
      attachments = attachments.filter((a: any) => a.id !== attachmentId);
      
      await query('UPDATE email_templates SET attachments = $1 WHERE id = $2', [JSON.stringify(attachments), id]);
    }

    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
