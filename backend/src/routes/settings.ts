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
  const smtpPort = parseInt(port, 10) || 465;
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      error: '이메일 형식이 올바르지 않습니다. (예: example@naver.com)' 
    });
  }
  
  if (!password) {
    return res.status(400).json({ 
      success: false, 
      error: '비밀번호(또는 애플리케이션 비밀번호)를 입력해주세요.' 
    });
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host: host || 'smtp.naver.com',
      port: smtpPort,
      secure: smtpPort === 465, // SSL for 465, STARTTLS for other ports
      auth: {
        user: email.trim(),
        pass: password,
      },
      connectionTimeout: 10000, // 10 seconds timeout
    });

    await transporter.verify();
    res.json({ success: true, message: 'SMTP connection successful' });
  } catch (err: any) {
    console.error('SMTP Test Error:', err);
    let errorMessage = err.message;
    if (err.code === 'EAUTH') {
      errorMessage = '인증에 실패했습니다. 아이디와 비밀번호(앱 비밀번호)를 확인해주세요.';
    } else if (err.code === 'ESOCKET') {
      errorMessage = '서버 연결에 실패했습니다. 호스트와 포트를 확인해주세요.';
    } else if (err.code === 'ETIMEDOUT') {
      errorMessage = '연결 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.';
    }
    res.status(400).json({ success: false, error: errorMessage });
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
    // Validate naver_smtp config
    if (key === 'naver_smtp' && typeof value === 'object') {
      const { email, password, host, port } = value;
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format in SMTP configuration' });
      }
      
      // Require email and password
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required in SMTP configuration' });
      }
    }

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
