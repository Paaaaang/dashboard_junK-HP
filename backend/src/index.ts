import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { query } from './db';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const dbCheck = await query('SELECT NOW()');
    res.json({
      status: 'OK',
      db: 'Connected',
      timestamp: dbCheck.rows[0].now,
      version: '1.0.0',
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'Error',
      db: 'Disconnected',
      message: err.message,
    });
  }
});

// Root diagnostic route
app.get('/api', async (req: Request, res: Response) => {
  try {
    const dbCheck = await query('SELECT 1 as connected');
    res.json({
      message: 'Dashboard API is running',
      database: dbCheck.rows[0].connected === 1 ? 'Connected' : 'Error',
      env: process.env.NODE_ENV,
    });
  } catch (err: any) {
    res.status(500).json({
      message: 'Dashboard API is running but Database is unreachable',
      error: err.message,
      hint: 'Check your DATABASE_URL and password in backend/.env',
    });
  }
});

// --- Companies API ---
app.get('/api/v1/companies', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        c.*,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'courseType', cg.name,
                'enabled', true,
                'programNames', (
                  SELECT COALESCE(json_agg(DISTINCT sc.name), '[]')
                  FROM sub_courses sc 
                  JOIN enrollments e ON e.sub_course_id = sc.id
                  JOIN participants p ON p.id = e.participant_id
                  WHERE p.company_id = c.id AND sc.group_id = cg.id
                ),
                'status', '참여중'
              )
            )
            FROM course_groups cg
            WHERE EXISTS (
              SELECT 1 FROM sub_courses sc 
              JOIN enrollments e ON e.sub_course_id = sc.id
              JOIN participants p ON p.id = e.participant_id
              WHERE p.company_id = c.id AND sc.group_id = cg.id
            )
          ),
          '[]'
        ) as participations
      FROM companies c
      ORDER BY c.company_name ASC
    `);
    
    const companies = result.rows.map(row => ({
      id: row.id,
      companyName: row.company_name,
      businessRegNo: row.business_reg_no,
      location: row.location,
      representative: row.representative,
      manager: row.manager,
      phone: row.phone,
      email: row.email,
      mouSigned: row.mou_signed,
      mouSignedDate: row.mou_signed_date,
      createdAt: row.created_at,
      participations: row.participations
    }));

    res.json(companies);
  } catch (err: any) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
  }
});

app.post('/api/v1/companies', async (req: Request, res: Response) => {
  const { companyName, businessRegNo, location, representative, manager, phone, email, mouSigned, mouSignedDate } = req.body;
  try {
    const result = await query(
      `INSERT INTO companies (company_name, business_reg_no, location, representative, manager, phone, email, mou_signed, mou_signed_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [companyName, businessRegNo, location, representative, manager, phone, email, mouSigned || false, mouSignedDate || null]
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      companyName: row.company_name,
      businessRegNo: row.business_reg_no,
      location: row.location,
      representative: row.representative,
      manager: row.manager,
      phone: row.phone,
      email: row.email,
      mouSigned: row.mou_signed,
      mouSignedDate: row.mou_signed_date,
      createdAt: row.created_at,
      participations: []
    });
  } catch (err: any) {
    console.error('Error creating company:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/v1/companies/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { companyName, businessRegNo, location, representative, manager, phone, email, mouSigned, mouSignedDate } = req.body;
  try {
    const result = await query(
      `UPDATE companies 
       SET company_name = $1, business_reg_no = $2, location = $3, representative = $4, manager = $5, phone = $6, email = $7, mou_signed = $8, mou_signed_date = $9
       WHERE id = $10
       RETURNING *`,
      [companyName, businessRegNo, location, representative, manager, phone, email, mouSigned, mouSignedDate, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      companyName: row.company_name,
      businessRegNo: row.business_reg_no,
      location: row.location,
      representative: row.representative,
      manager: row.manager,
      phone: row.phone,
      email: row.email,
      mouSigned: row.mou_signed,
      mouSignedDate: row.mou_signed_date,
      createdAt: row.created_at,
      participations: req.body.participations || []
    });
  } catch (err: any) {
    console.error('Error updating company:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/v1/companies/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM companies WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err: any) {
    console.error('Error deleting company:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Participants API ---
app.get('/api/v1/participants', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        p.*,
        c.company_name,
        c.location as company_location,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', e.id,
                'courseType', cg.name,
                'subCourseName', sc.name,
                'startDate', sc.start_date,
                'endDate', sc.end_date,
                'totalHours', sc.total_hours,
                'status', e.status
              )
            )
            FROM enrollments e
            JOIN sub_courses sc ON sc.id = e.sub_course_id
            JOIN course_groups cg ON cg.id = sc.group_id
            WHERE e.participant_id = p.id
          ),
          '[]'
        ) as enrollments
      FROM participants p
      LEFT JOIN companies c ON p.company_id = c.id
      ORDER BY p.name ASC
    `);

    const participants = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      companyId: row.company_id,
      companyName: row.company_name,
      companyLocation: row.company_location,
      position: row.position,
      phone: row.phone,
      email: row.email,
      employmentInsurance: row.employment_insurance,
      workExperience: row.work_experience,
      documentSkill: row.document_skill,
      enrollments: row.enrollments
    }));

    res.json(participants);
  } catch (err: any) {
    console.error('Error fetching participants:', err);
    res.status(500).json({ error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
  }
});

app.post('/api/v1/participants', async (req: Request, res: Response) => {
  const { name, companyId, position, phone, email, employmentInsurance } = req.body;
  try {
    const result = await query(
      `INSERT INTO participants (name, company_id, position, phone, email, employment_insurance)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, companyId, position, phone, email, employmentInsurance || '미확인']
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      name: row.name,
      companyId: row.company_id,
      position: row.position,
      phone: row.phone,
      email: row.email,
      employmentInsurance: row.employment_insurance,
      enrollments: []
    });
  } catch (err: any) {
    console.error('Error creating participant:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/v1/participants/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, companyId, position, phone, email, employmentInsurance } = req.body;
  try {
    const result = await query(
      `UPDATE participants 
       SET name = $1, company_id = $2, position = $3, phone = $4, email = $5, employment_insurance = $6
       WHERE id = $7
       RETURNING *`,
      [name, companyId, position, phone, email, employmentInsurance, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      companyId: row.company_id,
      position: row.position,
      phone: row.phone,
      email: row.email,
      employmentInsurance: row.employment_insurance,
      enrollments: req.body.enrollments || []
    });
  } catch (err: any) {
    console.error('Error updating participant:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/v1/participants/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM participants WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err: any) {
    console.error('Error deleting participant:', err);
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
