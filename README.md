# Automation Dashboard

완벽한 웹 기반 자동화 대시보드 개발 환경입니다.

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 18+ 
- npm 또는 yarn
- Docker & Docker Compose (데이터베이스 실행)

### 1단계: 의존성 설치

```bash
npm install
```

### 2단계: 환경 설정

```bash
# 백엔드
cp backend/.env.example backend/.env

# 프론트엔드
cp frontend/.env.example frontend/.env
```

### 3단계: 데이터베이스 시작

```bash
npm run docker:up
```

이 명령어는 다음을 실행합니다:
- **PostgreSQL** (포트 5432)
- **Redis** (포트 6379)
- **pgAdmin** (포트 5050)

#### pgAdmin 접속
- URL: http://localhost:5050
- 이메일: admin@dashboard.local
- 암호: admin

### 4단계: 개발 서버 시작

두 개의 터미널을 열고 각각 실행하세요:

**터미널 1 - 백엔드:**
```bash
npm run backend:dev
# 또는
npm --workspace=backend run dev
```

**터미널 2 - 프론트엔드:**
```bash
npm run frontend:dev
# 또는
npm --workspace=frontend run dev
```

그 후 자동으로 브라우저가 열립니다:
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:3001/api

---

## 📁 프로젝트 구조

```
dashboard_khp/
├── backend/                    # Express.js + TypeScript 백엔드
│   ├── src/
│   │   ├── index.ts           # 애플리케이션 진입점
│   │   ├── routes/            # API 라우트
│   │   ├── controllers/       # 요청 핸들러
│   │   ├── models/            # DB 모델 (Sequelize)
│   │   ├── services/          # 비즈니스 로직
│   │   ├── middleware/        # Express 미들웨어
│   │   └── config/            # 설정 파일
│   ├── dist/                  # 컴파일된 JS 출력
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── main.tsx           # 애플리케이션 진입점
│   │   ├── App.tsx            # 루트 컴포넌트
│   │   ├── components/        # 재사용 가능한 컴포넌트
│   │   ├── pages/             # 페이지 컴포넌트
│   │   ├── hooks/             # 커스텀 React 훅
│   │   ├── api/               # API 클라이언트
│   │   ├── store/             # Redux 스토어
│   │   ├── types/             # TypeScript 타입 정의
│   │   └── index.css          # 전역 스타일
│   ├── public/                # 정적 파일
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docker-compose.yml         # 데이터베이스 & 서비스 구성
├── package.json              # 루트 워크스페이스 설정
├── .gitignore
└── README.md
```

---

## 🛠 유용한 명령어

### 개발
```bash
npm run dev              # 백엔드 + 프론트엔드 동시 실행
npm run backend:dev      # 백엔드만
npm run frontend:dev     # 프론트엔드만
```

### 빌드
```bash
npm run build            # 백엔드 + 프론트엔드 빌드
npm run backend:build    # 백엔드만 빌드
npm run frontend:build   # 프론트엔드만 빌드
```

### 린팅
```bash
npm run lint             # 코드 스타일 체크
npm run lint:fix         # 자동으로 스타일 수정
```

### 데이터베이스
```bash
npm run docker:up        # 모든 서비스 시작
npm run docker:down      # 모든 서비스 중지
npm run docker:logs      # 로그 확인 (실시간)
```

---

## 🔑 주요 기술 스택

### 백엔드
- **Express.js**: 웹 프레임워크
- **TypeScript**: 타입 안정성
- **PostgreSQL**: 관계형 데이터베이스
- **Sequelize**: ORM
- **Bull**: Job Queue (워크플로우 자동화)
- **Redis**: 캐싱 & 메시지 큐

### 프론트엔드
- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안정성
- **Vite**: 번들러 & 개발 서버
- **React Router**: 라우팅
- **Redux Toolkit**: 상태 관리
- **Axios**: HTTP 클라이언트

---

## 📝 환경 변수

### 백엔드 (.env)
```
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dashboard_khp_db
DB_USER=dashboard_user
DB_PASSWORD=dashboard_password_secure
REDIS_HOST=localhost
REDIS_PORT=6379
FRONTEND_URL=http://localhost:3000
```

### 프론트엔드 (.env)
```
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Automation Dashboard
```

---

## 🧪 유효성 검증

개발 환경이 제대로 설정되었는지 확인하세요:

1. **PostgreSQL 연결 확인**
   ```bash
   # pgAdmin에서 확인:  http://localhost:5050
   ```

2. **Redis 연결 확인**
   ```bash
   docker exec dashboard_khp_redis redis-cli ping
   # 응답: PONG
   ```

3. **백엔드 상태 확인**
   ```bash
   curl http://localhost:3001/api/health
   # 응답: {"status":"OK","timestamp":"...","version":"1.0.0"}
   ```

4. **프론트엔드 로드 확인**
   - 브라우저에서 http://localhost:3000 방문
   - 대시보드 페이지가 로드되면 정상

---

## 🚨 문제 해결

### 포트가 이미 사용 중인 경우
```bash
# Windows
netstat -ano | findstr :3000
# 프로세스 종료
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Docker 컨테이너 재설정
```bash
npm run docker:down
docker system prune -a
npm run docker:up
```

### 의존성 캐시 초기화
```bash
npm run docker:down
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
npm run docker:up
```

---

## 📚 다음 단계

1. **인증 구현**: JWT 기반 인증 추가
2. **데이터베이스 모델**: Sequelize 모델 생성
3. **API 엔드포인트**: 워크플로우 CRUD 작성
4. **프론트엔드 페이지**: 워크플로우 관리 UI
5. **워크플로우 엔진**: Bull을 이용한 자동화 작업 처리
6. **테스팅**: Jest를 이용한 유닛 테스트

---

## 📞 지원

질문이나 문제가 있으면 이슈를 등록해주세요.

---

**Happy Coding! 🎉**
