# Dashboard KHP (K-하이테크 플랫폼 대시보드)

전남대학교 K-하이테크 플랫폼의 교육 과정과 참여 기업, 수강생 정보를 체계적으로 관리하고 분석하는 **전문가용 3-Tier 자동화 대시보드** 시스템입니다.

## ✨ 주요 핵심 성과

- **3-Tier 완벽 아키텍처**: Frontend (React) - Middleware (Express) - Database (PostgreSQL/Supabase) 구조로 설계되어 데이터 무결성과 보안을 보장합니다.
- **고도화된 실시간 분석**: Recharts를 활용하여 고용보험 가입 분포, 월별 참여 추이, 우수 파트너 랭킹 등 실무 인사이트를 제공합니다.
- **SOLID 아키텍처 (Frontend)**: 모든 거대 컴포넌트를 기능별 커스텀 훅과 서브 컴포넌트로 분해하여 유지보수성을 극대화했습니다.
- **강력한 데이터 정합성**: 참여자 등록 시 새로운 기업을 동시에 생성하는 복합 작업을 **DB 트랜잭션**으로 처리하여 안전하게 관리합니다.
- **성능 최적화**: 페이지별 Lazy Loading 및 대형 라이브러리 지연 로딩을 통해 초기 번들 크기를 400KB 이하로 최적화했습니다.

---

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 18+ 
- npm 또는 yarn
- Docker & Docker Compose (PostgreSQL 및 Redis 구동용)

### 1단계: 의존성 설치

```bash
# 레포 루트에서 실행 (npm workspaces로 backend/frontend를 함께 설치)
npm install
```

### 2단계: 환경 설정

- **Backend**: `backend/.env` 파일에 `DATABASE_URL`(Supabase PostgreSQL 연결 문자열)을 설정하세요.
- **Frontend**: `frontend/.env` 파일에 `VITE_API_URL=http://127.0.0.1:3001/api`를 설정하세요.

### 📧 이메일 발송 설정 (네이버 SMTP)
이메일 기능을 사용하려면 다음 설정이 필요합니다:
1. 네이버 메일 로그인 > 환경 설정 > **POP3/IMAP 설정** > 'IMAP/SMTP 사용'을 **사용함**으로 변경
2. 네이버 계정 보안 설정 > **2단계 인증** 사용 설정
3. **애플리케이션 비밀번호** 발급 (기기 종류: 기타)
4. 발급된 비밀번호를 `backend/.env`의 `NAVER_APP_PASSWORD`에 입력

### 3단계: 인프라 서비스 시작

```bash
# Docker를 통해 DB 및 Redis 시작
npm run docker:up
```

### 4단계: 개발 서버 시작 (Hot Reload 지원)

두 개의 터미널을 열고 각각 실행하거나, 루트에서 통합 명령어를 사용하세요:

```bash
# 통합 실행 (추천)
npm run dev
```

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:3001/api

---

## 📁 프로젝트 구조 (SOLID Refactored)

```
dashboard_junK-HP/
├── backend/                    # Express.js + Node-Postgres (pg)
│   ├── src/
│   │   ├── index.ts           # REST API 엔드포인트 및 트랜잭션 로직
│   │   └── db.ts              # PostgreSQL Connection Pool 설정
│
├── frontend/                   # React + TypeScript + TailwindCSS
│   ├── src/
│   │   ├── stores/            # Zustand 전역 상태 (API 연동 방식)
│   │   ├── hooks/             # 도메인별 SOLID 커스텀 훅
│   │   ├── pages/             # 페이지 컴포넌트 및 모듈별 섹션 분리
│   │   │   ├── companies/     # 기업 관리 (Hooks/Sections/Modals 분리)
│   │   │   └── participants/  # 참여자 관리 (Hooks/Modals 분리)
│   │   └── api/               # Axios 기반 중앙 API 클라이언트
│
├── docker-compose.yml         # PostgreSQL 16 + Redis 구성
└── plan.md                    # 통합 프로젝트 계획 및 달성 현황
```

---

## 🔑 기술 스택 상세

| Layer | Technology | Key Features |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript | SOLID 구조, Lazy Loading, TailwindCSS 4 |
| **State** | Zustand | API-first State Management, Async Sync |
| **Chart** | Recharts | Professional Data Visualization, Responsive |
| **Backend** | Express, Node-TS | RESTful API, Transactional safety |
| **Database** | PostgreSQL, Supabase | Relational Schema, RLS Security Hardening |
| **Utility** | SheetJS (xlsx) | 3-Step Excel Batch Upload & Detailed Export |

---

## 🧪 유효성 검증 및 상태 확인

1. **백엔드/DB 헬스체크**
   ```bash
   curl http://127.0.0.1:3001/api/health
   # 응답: {"status":"OK", "db":"Connected", ...}
   ```

2. **프론트엔드 데이터 로드 확인**
   - 대시보드 진입 시 Recharts 차트가 실제 DB 데이터를 바탕으로 부드럽게 애니메이션되며 렌더링되면 정상입니다.

---

## 🚨 문제 해결

- **Network Error**: 로컬 환경에 따라 `localhost` 대신 `127.0.0.1`을 사용하세요. `api/client.ts`에 이미 최적화되어 있습니다.
- **Port Conflict**: 3000(FE), 3001(BE), 5432(DB) 포트가 이미 사용 중인지 확인하세요.

---

**Happy Data-Driven Management! 📊**
