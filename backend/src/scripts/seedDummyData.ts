import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  try {
    console.log('--- Seeding Dummy Data ---');

    // 1. Create Companies
    console.log('Creating companies...');
    const companies = [
      {
        id: uuidv4(),
        name: '한빛테크',
        regNo: '123-45-67890',
        loc: '서울시 강남구',
        rep: '김철수',
        mgr: '이영희',
        phone: '02-123-4567',
        email: 'contact@hanbit.com',
        mou: true,
        mouDate: '2025-01-15'
      },
      {
        id: uuidv4(),
        name: '미래정보기술',
        regNo: '234-56-78901',
        loc: '경기도 성남시',
        rep: '박미래',
        mgr: '최지성',
        phone: '031-987-6543',
        email: 'hr@mirae-it.co.kr',
        mou: false,
        mouDate: null
      },
      {
        id: uuidv4(),
        name: '글로벌메디컬',
        regNo: '345-67-89012',
        loc: '인천시 서구',
        rep: '정성실',
        mgr: '강희재',
        phone: '032-111-2222',
        email: 'info@globalmed.com',
        mou: true,
        mouDate: '2024-11-20'
      }
    ];

    for (const c of companies) {
      await query(
        `INSERT INTO companies (id, company_name, business_reg_no, location, representative, manager, phone, email, mou_signed, mou_signed_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [c.id, c.name, c.regNo, c.loc, c.rep, c.mgr, c.phone, c.email, c.mou, c.mouDate]
      );
    }

    // 2. Create Course Groups
    console.log('Creating course groups...');
    const groups = [
      { id: uuidv4(), name: '의료기기 품질관리 전문가 과정', desc: 'ISO 13485 및 GMP 실무 교육' },
      { id: uuidv4(), name: '디지털 헬스케어 소프트웨어 개발', desc: '의료용 SW 인허가 및 개발 프로세스' }
    ];

    for (const g of groups) {
      await query(
        `INSERT INTO course_groups (id, name, description) VALUES ($1, $2, $3)`,
        [g.id, g.name, g.desc]
      );
    }

    // 3. Create Sub Courses
    console.log('Creating sub courses...');
    const subCourses = [
      {
        id: uuidv4(),
        groupId: groups[0].id,
        name: 'ISO 13485:2016 기본 및 심화',
        start: '2026-06-01',
        end: '2026-06-05',
        hours: 40,
        target: 20
      },
      {
        id: uuidv4(),
        groupId: groups[0].id,
        name: '의료기기 GMP 문서화 실무',
        start: '2026-07-10',
        end: '2026-07-12',
        hours: 24,
        target: 15
      },
      {
        id: uuidv4(),
        groupId: groups[1].id,
        name: 'IEC 62304 의료용 SW 생명주기',
        start: '2026-08-01',
        end: '2026-08-03',
        hours: 20,
        target: 10
      }
    ];

    for (const sc of subCourses) {
      await query(
        `INSERT INTO sub_courses (id, group_id, name, start_date, end_date, total_hours, target_outcome)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sc.id, sc.groupId, sc.name, sc.start, sc.end, sc.hours, sc.target]
      );
    }

    // 4. Create Participants
    console.log('Creating participants...');
    const participants = [
      {
        id: uuidv4(),
        companyId: companies[0].id,
        name: '박소영',
        pos: '대리',
        phone: '010-1234-5678',
        email: 'sy.park@hanbit.com',
        ins: '가입',
        exp: '3~5년차',
        skill: '일부 작성 경험 있음'
      },
      {
        id: uuidv4(),
        companyId: companies[0].id,
        name: '이민준',
        pos: '과장',
        phone: '010-2345-6789',
        email: 'mj.lee@hanbit.com',
        ins: '가입',
        exp: '5~10년차',
        skill: '능숙'
      },
      {
        id: uuidv4(),
        companyId: companies[1].id,
        name: '최하늘',
        pos: '사원',
        phone: '010-3456-7890',
        email: 'hn.choi@mirae-it.co.kr',
        ins: '미가입',
        exp: '3년차 이하',
        skill: '없음'
      },
      {
        id: uuidv4(),
        companyId: companies[2].id,
        name: '강다해',
        pos: '팀장',
        phone: '010-4567-8901',
        email: 'dh.kang@globalmed.com',
        ins: '가입',
        exp: '10년차 이상',
        skill: '전문가 수준'
      }
    ];

    for (const p of participants) {
      await query(
        `INSERT INTO participants (id, company_id, name, position, phone, email, employment_insurance, work_experience, document_skill)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [p.id, p.companyId, p.name, p.pos, p.phone, p.email, p.ins, p.exp, p.skill]
      );
    }

    // 5. Create Enrollments
    console.log('Creating enrollments...');
    const enrollments = [
      { pid: participants[0].id, scid: subCourses[0].id, status: '수료', compDate: '2026-06-05', cert: 'CERT-2026-001' },
      { pid: participants[1].id, scid: subCourses[0].id, status: '수료', compDate: '2026-06-05', cert: 'CERT-2026-002' },
      { pid: participants[2].id, scid: subCourses[2].id, status: '미수료', compDate: null, cert: null },
      { pid: participants[3].id, scid: subCourses[1].id, status: '수료', compDate: '2026-07-12', cert: 'CERT-2026-003' }
    ];

    for (const e of enrollments) {
      await query(
        `INSERT INTO enrollments (id, participant_id, sub_course_id, status, completion_date, certificate_no)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuidv4(), e.pid, e.scid, e.status, e.compDate, e.cert]
      );
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
