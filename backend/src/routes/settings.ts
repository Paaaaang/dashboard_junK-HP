import { Router, Request, Response } from 'express';
import { query } from '../db';
import nodemailer from 'nodemailer';

const router = Router();

/**
 * POST /api/v1/settings/smtp/test
 * Test SMTP connection with provided credentials
 */
router.post('/smtp/test', async (req: Request, res: Response) => {
  const { host, port, email, password } = req.body;
  try {
    const transporter = nodemailer.createTransport({
      host: host || 'smtp.naver.com',
      port: port || 465,
      secure: true,
      auth: {
        user: email,
        pass: password,
      },
    });

    await transporter.verify();
    res.json({ success: true, message: 'SMTP connection successful' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/settings
 * Fetch all system settings.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT key, value FROM system_settings');
    const settings = result.rows.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/v1/settings/:key
 * Update a specific setting.
 */
router.put('/:key', async (req: Request, res: Response) => {
  const { key } = req.params;
  const { value } = req.body;
  try {
    await query(
      'INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
      [key, JSON.stringify(value)]
    );
    res.json({ success: true, key, value });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
