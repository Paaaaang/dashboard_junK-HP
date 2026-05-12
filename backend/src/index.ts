import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import pool, { query } from './db';
import emailRoutes from './routes/emails';
import settingsRoutes from './routes/settings';
import authRoutes from './routes/auth';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app: Express = express();
const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public Routes
app.use('/api/v1/auth', authRoutes);

// Health check route (Public)
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

// Protected Routes
app.use('/api/v1/emails', authenticateToken, emailRoutes);
app.use('/api/v1/settings', authenticateToken, settingsRoutes);

// Stats API
app.get('/api/v1/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const [
      companiesRes, 
      participantsRes, 
      enrollmentsRes, 
      courseGroupsRes,
      insuranceRes,
      monthlyRes,
      mouRes,
      topCompaniesRes,
      subCourseRes,
      recentLogsRes
    ] = await Promise.all([
      query('SELECT COUNT(*) FROM companies'),
      query('SELECT COUNT(*) FROM participants'),
      query('SELECT status, COUNT(*) FROM enrollments GROUP BY status'),
      query(`
        SELECT cg.name as label, COUNT(DISTINCT cc.company_id) as value
        FROM course_groups cg
        LEFT JOIN sub_courses sc ON sc.group_id = cg.id
        LEFT JOIN company_courses cc ON cc.sub_course_id = sc.id
        GROUP BY cg.name
      `),
      query(`
        SELECT employment_insurance as label, COUNT(*) as value 
        FROM participants 
        GROUP BY employment_insurance
      `),
      query(`
        SELECT TO_CHAR(application_date, 'YYYY-MM') as month, COUNT(*) as value
        FROM enrollments
        WHERE application_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY TO_CHAR(application_date, 'YYYY-MM')
        ORDER BY month ASC
      `),
      query('SELECT COUNT(*) FROM companies WHERE mou_signed = true'),
      query(`
        SELECT c.company_name as label, COUNT(cc.id) as value
        FROM companies c
        JOIN company_courses cc ON cc.company_id = c.id
        GROUP BY c.company_name
        ORDER BY value DESC
        LIMIT 5
      `),
      query(`
        SELECT sc.name as label, COUNT(e.id) as value
        FROM sub_courses sc
        LEFT JOIN enrollments e ON e.sub_course_id = sc.id
        GROUP BY sc.name
        ORDER BY value DESC
        LIMIT 8
      `),
      query(`
        SELECT action_type, entity_type, entity_name, details, created_at
        FROM system_logs
        ORDER BY created_at DESC
        LIMIT 10
      `)
    ]);

    const totalCompanies = parseInt(companiesRes.rows[0].count);
    const totalParticipants = parseInt(participantsRes.rows[0].count);
    const mouSignedCount = parseInt(mouRes.rows[0].count);
    const mouRate = totalCompanies > 0 ? Math.round((mouSignedCount / totalCompanies) * 100) : 0;
    
    const enrollmentStats = enrollmentsRes.rows.reduce((acc: any, row: any) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});
    
    const totalEnrollments = (enrollmentStats['수료'] || 0) + (enrollmentStats['미수료'] || 0);
    const completionRate = totalEnrollments > 0 
      ? Math.round((enrollmentStats['수료'] || 0) / totalEnrollments * 100) 
      : 0;

    res.json({
      summary: [
        { label: '전체 참여 기업수', value: totalCompanies.toLocaleString(), trend: 'up', deltaValue: '+12%', deltaLabel: '지난달 대비' },
        { label: '전체 참여자 수', value: totalParticipants.toLocaleString(), trend: 'up', deltaValue: '+5.4%', deltaLabel: '지난주 대비' },
        { label: '평균 수료율', value: `${completionRate}%`, trend: 'up', deltaValue: '+2.1%', deltaLabel: '상향' },
        { label: '협약 체결률', value: `${mouRate}%`, trend: 'up', deltaValue: '실시간', deltaLabel: '' },
      ],
      charts: {
        courseCompanies: courseGroupsRes.rows.map(row => ({
          label: row.label.replace('과정', ''),
          value: parseInt(row.value)
        })),
        subCourseParticipation: subCourseRes.rows.map(row => ({
          label: row.label,
          value: parseInt(row.value)
        })),
        insuranceDistribution: insuranceRes.rows.map(row => ({
          name: row.label || '미확인',
          value: parseInt(row.value)
        })),
        monthlyParticipation: monthlyRes.rows.map(row => ({
          name: row.month,
          value: parseInt(row.value)
        })),
        topCompanies: topCompaniesRes.rows.map(row => ({
          name: row.label,
          value: parseInt(row.value)
        }))
      },
      recentActivity: recentLogsRes.rows.map(row => ({
        type: row.action_type,
        entity: row.entity_type,
        name: row.entity_name,
        details: row.details,
        date: row.created_at
      }))
    });
  } catch (err: any) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: err.message });
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
                  WHERE sc.group_id = cg.id AND (
                    EXISTS (
                      SELECT 1 FROM company_courses cc 
                      WHERE cc.company_id = c.id AND cc.sub_course_id = sc.id
                    )
                    OR EXISTS (
                      SELECT 1 FROM enrollments e 
                      JOIN participants p ON p.id = e.participant_id
                      WHERE p.company_id = c.id AND e.sub_course_id = sc.id
                    )
                  )
                ),
                'status', '참여중'
              )
            )
            FROM course_groups cg
            WHERE EXISTS (
              SELECT 1 FROM sub_courses sc 
              WHERE sc.group_id = cg.id AND (
                EXISTS (
                  SELECT 1 FROM company_courses cc 
                  WHERE cc.company_id = c.id AND cc.sub_course_id = sc.id
                )
                OR EXISTS (
                  SELECT 1 FROM enrollments e 
                  JOIN participants p ON p.id = e.participant_id
                  WHERE p.company_id = c.id AND e.sub_course_id = sc.id
                )
              )
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
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/companies', async (req: Request, res: Response) => {
  const { companyName, businessRegNo, location, representative, manager, phone, email, mouSigned, mouSignedDate, participations = [] } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO companies (company_name, business_reg_no, location, representative, manager, phone, email, mou_signed, mou_signed_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [companyName, businessRegNo, location, representative, manager, phone, email, mouSigned || false, mouSignedDate || null]
    );
    const company = result.rows[0];

    // Handle participations (assignments)
    for (const p of participations) {
      if (!p.enabled || !p.programNames.length) continue;
      for (const progName of p.programNames) {
        const scRes = await client.query('SELECT id FROM sub_courses WHERE name = $1', [progName]);
        if (scRes.rowCount && scRes.rowCount > 0) {
          await client.query(
            'INSERT INTO company_courses (company_id, sub_course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [company.id, scRes.rows[0].id]
          );
        }
      }
    }

    // Log action
    await client.query(
      'INSERT INTO system_logs (action_type, entity_type, entity_name, details) VALUES ($1, $2, $3, $4)',
      ['CREATE', 'COMPANY', companyName, `신규 기업 등록: ${companyName}`]
    );

    await client.query('COMMIT');
    res.status(201).json({ ...company, participations });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error creating company:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/v1/companies/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { companyName, businessRegNo, location, representative, manager, phone, email, mouSigned, mouSignedDate, participations = [] } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE companies 
       SET company_name = $1, business_reg_no = $2, location = $3, representative = $4, manager = $5, phone = $6, email = $7, mou_signed = $8, mou_signed_date = $9
       WHERE id = $10
       RETURNING *`,
      [companyName, businessRegNo, location, representative, manager, phone, email, mouSigned, mouSignedDate, id]
    );
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Company not found' });
    }

    // Update participations (assignments)
    await client.query('DELETE FROM company_courses WHERE company_id = $1', [id]);
    for (const p of participations) {
      if (!p.enabled || !p.programNames.length) continue;
      for (const progName of p.programNames) {
        const scRes = await client.query('SELECT id FROM sub_courses WHERE name = $1', [progName]);
        if (scRes.rowCount && scRes.rowCount > 0) {
          await client.query(
            'INSERT INTO company_courses (company_id, sub_course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, scRes.rows[0].id]
          );
        }
      }
    }

    // Log action
    await client.query(
      'INSERT INTO system_logs (action_type, entity_type, entity_name, details) VALUES ($1, $2, $3, $4)',
      ['UPDATE', 'COMPANY', companyName, `기업 정보 수정: ${companyName}`]
    );

    await client.query('COMMIT');
    const updated = result.rows[0];
    res.json({ 
      id: updated.id,
      companyName: updated.company_name,
      businessRegNo: updated.business_reg_no,
      location: updated.location,
      representative: updated.representative,
      manager: updated.manager,
      phone: updated.phone,
      email: updated.email,
      mouSigned: updated.mou_signed,
      mouSignedDate: updated.mou_signed_date,
      createdAt: updated.created_at,
      participations 
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error updating company:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/v1/companies/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const nameRes = await query('SELECT company_name FROM companies WHERE id = $1', [id]);
    const companyName = nameRes.rows[0]?.company_name || 'Unknown';

    await query('DELETE FROM companies WHERE id = $1', [id]);

    // Log action
    await query(
      'INSERT INTO system_logs (action_type, entity_type, entity_name, details) VALUES ($1, $2, $3, $4)',
      ['DELETE', 'COMPANY', companyName, `기업 삭제: ${companyName}`]
    );

    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/companies/batch', async (req: Request, res: Response) => {
  const { companies } = req.body;
  if (!Array.isArray(companies)) return res.status(400).json({ error: 'Companies must be an array' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const savedCompanies = [];
    for (const company of companies) {
      const { companyName, businessRegNo, location, representative, manager, phone, email, mouSigned, mouSignedDate } = company;
      const result = await client.query(
        `INSERT INTO companies (company_name, business_reg_no, location, representative, manager, phone, email, mou_signed, mou_signed_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (business_reg_no) DO UPDATE SET
           company_name = EXCLUDED.company_name,
           location = EXCLUDED.location,
           representative = EXCLUDED.representative,
           manager = EXCLUDED.manager,
           phone = EXCLUDED.phone,
           email = EXCLUDED.email,
           mou_signed = EXCLUDED.mou_signed,
           mou_signed_date = EXCLUDED.mou_signed_date
         RETURNING *`,
        [companyName, businessRegNo, location, representative, manager, phone, email, mouSigned || false, mouSignedDate || null]
      );
      savedCompanies.push(result.rows[0]);
    }

    // Log batch action
    await client.query(
      'INSERT INTO system_logs (action_type, entity_type, entity_name, details) VALUES ($1, $2, $3, $4)',
      ['CREATE', 'COMPANY', 'Multiple Companies', `${companies.length}개 기업 일괄 등록(Excel)`]
    );

    await client.query('COMMIT');
    res.status(201).json(savedCompanies.map(row => ({ ...row, participations: [] })));
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
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
                'subCourseId', sc.id,
                'sessionId', e.session_id,
                'startDate', sc.start_date,
                'endDate', sc.end_date,
                'totalHours', sc.total_hours,
                'status', e.status,
                'completionDate', e.completion_date,
                'certificateNo', e.certificate_no,
                'applicationDate', e.application_date
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
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/sessions/:id/participants
app.get('/api/v1/sessions/:id/participants', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(`
      SELECT 
        e.id as enrollment_id,
        p.id as participant_id,
        p.name,
        c.company_name,
        e.status,
        e.completion_date,
        e.certificate_no,
        e.application_date
      FROM enrollments e
      JOIN participants p ON p.id = e.participant_id
      LEFT JOIN companies c ON c.id = p.company_id
      WHERE e.session_id = $1
      ORDER BY p.name ASC
    `, [id]);

    const participants = result.rows.map(row => ({
      enrollmentId: row.enrollment_id,
      participantId: row.participant_id,
      name: row.name,
      companyName: row.company_name,
      status: row.status,
      completionDate: row.completion_date,
      certificateNo: row.certificate_no,
      applicationDate: row.application_date
    }));

    res.json(participants);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/participants', async (req: Request, res: Response) => {
  const { 
    name, companyId, position, phone, email, 
    employmentInsurance, workExperience, documentSkill, 
    enrollments = [],
    newCompany 
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let targetCompanyId = companyId;

    if (newCompany && newCompany.companyName) {
      const compResult = await client.query(
        `INSERT INTO companies (company_name, location, representative)
         VALUES ($1, $2, $3) RETURNING id`,
        [newCompany.companyName, newCompany.location, newCompany.representative]
      );
      targetCompanyId = compResult.rows[0].id;
    }

    const result = await client.query(
      `INSERT INTO participants (name, company_id, position, phone, email, employment_insurance, work_experience, document_skill)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, targetCompanyId, position, phone, email, employmentInsurance || '미확인', workExperience, documentSkill]
    );
    const participant = result.rows[0];

    // Auto-assign company to course if registering via participant?
    // For now, let's just log
    await client.query(
      'INSERT INTO system_logs (action_type, entity_type, entity_name, details) VALUES ($1, $2, $3, $4)',
      ['CREATE', 'PARTICIPANT', name, `참여자 등록: ${name} (${newCompany ? '신규 기업 포함' : '기존 기업'})`]
    );

    const savedEnrollments = [];
    for (const enr of enrollments) {
      let scId = enr.subCourseId;
      if (!scId) {
        const scRes = await client.query('SELECT id FROM sub_courses WHERE name = $1', [enr.subCourseName]);
        if (scRes.rowCount && scRes.rowCount > 0) scId = scRes.rows[0].id;
      }
      if (scId) {
        const enrResult = await client.query(
          `INSERT INTO enrollments (participant_id, sub_course_id, status, completion_date, certificate_no, application_date, session_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [participant.id, scId, enr.status || '미수료', enr.completionDate, enr.certificateNo, enr.applicationDate, enr.sessionId || null]
        );
        savedEnrollments.push(enrResult.rows[0]);
        
        // Also ensure company is linked to this course in company_courses
        await client.query(
          'INSERT INTO company_courses (company_id, sub_course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [targetCompanyId, scId]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ ...participant, companyId: targetCompanyId, enrollments: savedEnrollments });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/v1/participants/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, companyId, position, phone, email, employmentInsurance, workExperience, documentSkill, enrollments = [] } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE participants 
       SET name = $1, company_id = $2, position = $3, phone = $4, email = $5, employment_insurance = $6, work_experience = $7, document_skill = $8
       WHERE id = $9 RETURNING *`,
      [name, companyId, position, phone, email, employmentInsurance, workExperience, documentSkill, id]
    );
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Participant not found' });
    }

    await client.query(
      'INSERT INTO system_logs (action_type, entity_type, entity_name, details) VALUES ($1, $2, $3, $4)',
      ['UPDATE', 'PARTICIPANT', name, `참여자 정보 수정: ${name}`]
    );

    await client.query('DELETE FROM enrollments WHERE participant_id = $1', [id]);
    const savedEnrollments = [];
    for (const enr of enrollments) {
      let scId = enr.subCourseId;
      if (!scId) {
        const scRes = await client.query('SELECT id FROM sub_courses WHERE name = $1', [enr.subCourseName]);
        if (scRes.rowCount && scRes.rowCount > 0) scId = scRes.rows[0].id;
      }
      if (scId) {
        const enrResult = await client.query(
          `INSERT INTO enrollments (participant_id, sub_course_id, status, completion_date, certificate_no, application_date, session_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [id, scId, enr.status, enr.completionDate, enr.certificateNo, enr.applicationDate, enr.sessionId || null]
        );
        savedEnrollments.push(enrResult.rows[0]);
        
        await client.query(
          'INSERT INTO company_courses (company_id, sub_course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [companyId, scId]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ ...result.rows[0], enrollments: savedEnrollments });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/v1/participants/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const nameRes = await query('SELECT name FROM participants WHERE id = $1', [id]);
    const ptName = nameRes.rows[0]?.name || 'Unknown';
    await query('DELETE FROM participants WHERE id = $1', [id]);
    await query(
      'INSERT INTO system_logs (action_type, entity_type, entity_name, details) VALUES ($1, $2, $3, $4)',
      ['DELETE', 'PARTICIPANT', ptName, `참여자 삭제: ${ptName}`]
    );
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/participants/batch', async (req: Request, res: Response) => {
  const { participants } = req.body;
  if (!Array.isArray(participants)) return res.status(400).json({ error: 'Participants must be an array' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const savedParticipants = [];
    for (const pt of participants) {
      const { name, companyId, position, phone, email, employmentInsurance, workExperience, documentSkill } = pt;
      const result = await client.query(
        `INSERT INTO participants (name, company_id, position, phone, email, employment_insurance, work_experience, document_skill)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (name, company_id) DO UPDATE SET
           position = EXCLUDED.position, phone = EXCLUDED.phone, email = EXCLUDED.email, 
           employment_insurance = EXCLUDED.employment_insurance, work_experience = EXCLUDED.work_experience, 
           document_skill = EXCLUDED.document_skill
         RETURNING *`,
        [name, companyId, position, phone, email, employmentInsurance || '미확인', workExperience, documentSkill]
      );
      savedParticipants.push(result.rows[0]);
    }

    await client.query(
      'INSERT INTO system_logs (action_type, entity_type, entity_name, details) VALUES ($1, $2, $3, $4)',
      ['CREATE', 'PARTICIPANT', 'Multiple Participants', `${participants.length}명 참여자 일괄 등록(Excel)`]
    );

    await client.query('COMMIT');
    res.status(201).json(savedParticipants.map(row => ({ ...row, enrollments: [] })));
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- Enrollments API ---
app.post('/api/v1/enrollments', authenticateToken, async (req: Request, res: Response) => {
  const { participantId, subCourseId, sessionId, status, applicationDate } = req.body;
  try {
    const result = await query(
      `INSERT INTO enrollments (participant_id, sub_course_id, session_id, status, application_date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (participant_id, sub_course_id) DO UPDATE SET session_id = $3, status = $4
       RETURNING *`,
      [participantId, subCourseId, sessionId, status || '미수료', applicationDate || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/v1/enrollments/bulk', authenticateToken, async (req: Request, res: Response) => {
  const { enrollmentIds, status, completionDate } = req.body;
  
  if (!Array.isArray(enrollmentIds) || !status) {
    return res.status(400).json({ error: 'enrollmentIds array and status are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const id of enrollmentIds) {
      const certNo = status === '수료' ? `CERT-2026-${Math.floor(Math.random() * 9000 + 1000)}` : null;
      await client.query(
        `UPDATE enrollments 
         SET status = $1, 
             completion_date = $2, 
             certificate_no = CASE WHEN $1 = '수료' AND certificate_no IS NULL THEN $3 ELSE certificate_no END
         WHERE id = $4`,
        [status, status === '수료' ? (completionDate || new Date()) : null, certNo, id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, count: enrollmentIds.length });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/v1/enrollments/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await query('DELETE FROM enrollments WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Course Groups & Sub Courses API ---
app.get('/api/v1/course-groups', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM course_groups ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/course-groups', async (req: Request, res: Response) => {
  const { name, description } = req.body;
  try {
    const result = await query('INSERT INTO course_groups (name, description) VALUES ($1, $2) RETURNING *', [name, description]);
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/v1/course-groups/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const result = await query('UPDATE course_groups SET name = $1, description = $2 WHERE id = $3 RETURNING *', [name, description, id]);
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/v1/course-groups/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM course_groups WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/sub-courses', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT sc.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', scs.id,
              'startDate', scs.start_date,
              'endDate', scs.end_date,
              'totalHours', scs.total_hours,
              'targetOutcome', scs.target_outcome
            )
          ) FILTER (WHERE scs.id IS NOT NULL),
          '[]'
        ) as sessions
      FROM sub_courses sc
      LEFT JOIN sub_course_sessions scs ON scs.sub_course_id = sc.id
      GROUP BY sc.id
      ORDER BY sc.created_at ASC
    `);
    res.json(result.rows.map(row => ({
      id: row.id,
      groupId: row.group_id,
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
      totalHours: row.total_hours,
      targetOutcome: row.target_outcome,
      createdAt: row.created_at,
      sessions: row.sessions
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/sub-courses', async (req: Request, res: Response) => {
  const { groupId, name, startDate, endDate, totalHours, targetOutcome, sessions = [] } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO sub_courses (group_id, name, start_date, end_date, total_hours, target_outcome)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [groupId, name, startDate, endDate, totalHours, targetOutcome]
    );
    const subCourse = result.rows[0];

    const savedSessions = [];
    for (const session of sessions) {
      const sRes = await client.query(
        `INSERT INTO sub_course_sessions (sub_course_id, start_date, end_date, total_hours, target_outcome)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [subCourse.id, session.startDate || null, session.endDate || null, session.totalHours || 0, session.targetOutcome || 0]
      );
      savedSessions.push({
        id: sRes.rows[0].id,
        startDate: sRes.rows[0].start_date,
        endDate: sRes.rows[0].end_date,
        totalHours: sRes.rows[0].total_hours,
        targetOutcome: sRes.rows[0].target_outcome
      });
    }

    await client.query('COMMIT');
    res.status(201).json({ ...subCourse, sessions: savedSessions });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/v1/sub-courses/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { groupId, name, startDate, endDate, totalHours, targetOutcome, sessions = [] } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE sub_courses 
       SET group_id = $1, name = $2, start_date = $3, end_date = $4, total_hours = $5, target_outcome = $6
       WHERE id = $7 RETURNING *`,
      [groupId, name, startDate, endDate, totalHours, targetOutcome, id]
    );
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Sub-course not found' });
    }

    await client.query('DELETE FROM sub_course_sessions WHERE sub_course_id = $1', [id]);
    
    const savedSessions = [];
    for (const session of sessions) {
      const sRes = await client.query(
        `INSERT INTO sub_course_sessions (sub_course_id, start_date, end_date, total_hours, target_outcome)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [id, session.startDate || null, session.endDate || null, session.totalHours || 0, session.targetOutcome || 0]
      );
      savedSessions.push({
        id: sRes.rows[0].id,
        startDate: sRes.rows[0].start_date,
        endDate: sRes.rows[0].end_date,
        totalHours: sRes.rows[0].total_hours,
        targetOutcome: sRes.rows[0].target_outcome
      });
    }

    await client.query('COMMIT');
    res.json({ ...result.rows[0], sessions: savedSessions });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/v1/sub-courses/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM sub_courses WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Email Templates API ---
app.get('/api/v1/templates', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM email_templates ORDER BY name ASC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/templates', async (req: Request, res: Response) => {
  const { name, audience, subject, body } = req.body;
  try {
    const result = await query(
      'INSERT INTO email_templates (name, audience, subject, body) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, audience, subject, body]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/v1/templates/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, audience, subject, body } = req.body;
  try {
    const result = await query(
      'UPDATE email_templates SET name = $1, audience = $2, subject = $3, body = $4 WHERE id = $5 RETURNING *',
      [name, audience, subject, body, id]
    );
    if (result.rowCount && result.rowCount === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/v1/templates/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM email_templates WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err: any) {
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
