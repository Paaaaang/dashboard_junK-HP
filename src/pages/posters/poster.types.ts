// ── 채팅 메시지 타입 ────────────────────────────────────────────────
// 채팅 패널에서 사용자/AI 메시지를 표현합니다.
// thinking: 추론 모델의 내부 사고 내용 (ThinkingPanel에서 표시)
// streamType: 로딩 메시지 선택에 사용 (생성 vs 수정)
export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  thinking?: string;
  isStreaming?: boolean;
  streamType?: 'generate' | 'modify';
}

// ── 포스터 폼 데이터 타입 ───────────────────────────────────────────
// Step 1에서 입력받는 교육 프로그램 정보 전체를 담습니다.
export interface PosterFormData {
  courseName: string;
  introText: string;
  width: number;
  height: number;
  targetAudience: string;
  schedule: string;
  location: string;
  applyMethod: string;
  benefits: string[];
  curriculum: string;
  qrLink: string;
  contactPhone: string;
  contactEmail: string;
  contactWeb: string;
}

// ── AI 생성 중 로테이션 로딩 메시지 ────────────────────────────────
// RotatingMessage 컴포넌트에 전달되어 2.8초마다 순환 표시됩니다.
export const GENERATE_MSGS = [
  '교육 내용을 분석하고 있어요',
  '포스터 구조를 설계하고 있어요',
  '헤더 레이아웃을 구성하고 있어요',
  '색상과 타이포그래피를 조율하고 있어요',
  '교육 안내 섹션을 작성하고 있어요',
  '혜택 카드 디자인을 만들고 있어요',
  '교육 내용 영역을 배치하고 있어요',
  'QR 코드와 로고를 삽입하고 있어요',
  '프린트 CSS를 적용하고 있어요',
  '전체 코드를 검토하고 있어요',
];

// ── AI 수정 중 로테이션 로딩 메시지 ────────────────────────────────
export const MODIFY_MSGS = [
  '수정 내용을 파악하고 있어요',
  '변경할 부분을 찾고 있어요',
  '기존 디자인을 유지하며 수정하고 있어요',
  '코드를 정밀하게 조정하고 있어요',
  '최종 결과를 검토하고 있어요',
];

// ── 폼 초기값 ──────────────────────────────────────────────────────
// 전남대 생체재료개발센터 기본 교육 정보로 미리 채워 놓습니다.
// 사용자가 바로 "AI 포스터 생성"을 눌러 테스트할 수 있도록 합니다.
export const INITIAL_FORM: PosterFormData = {
  courseName: '',
  introText: '전남대학교 생체재료개발센터는 글로벌 비임상 CRO 전문기관 및 의료기기 규제과학(RA) 전문교육 기관으로서, 기업/기관 재직자 역량 강화 및 첨단기술분야 인력양성을 위한 무료교육 및 전문가 연계 기술자문을 실시하고 있습니다. 많은 관심과 참여 부탁드립니다.',
  width: 891,
  height: 1260,
  targetAudience: '의료기기 산업 관련 기업 재직자 (고용보험 가입 필수)',
  schedule: '2026. 06. 01.(월) 09:00 ~ 18:00 (1일, 8시간)',
  location: '전남대학교 K-하이테크 플랫폼 2층 교육장 (광주 북구 무등로 68-3, 2층)',
  applyMethod: 'QR코드 스캔 후 신청서 작성',
  benefits: ['교육비 전액 무료', '교재 및 중식 제공', '수료증 발급 (80% 이상 수강 시)', '전문가 기술자문 참여 우대'],
  curriculum: '',
  qrLink: '',
  contactPhone: '062-710-2896',
  contactEmail: 'bmclog@naver.com',
  contactWeb: 'https://bmckhp.kr/',
};

// ── 미리보기 배경 체커보드 스타일 ──────────────────────────────────
// PosterPreviewPanel에서 포스터 뒤 투명 영역임을 시각적으로 표시합니다.
export const CHECKERBOARD: React.CSSProperties = {
  backgroundImage: `linear-gradient(45deg, #c0c0c0 25%, transparent 25%),
    linear-gradient(-45deg, #c0c0c0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #c0c0c0 75%),
    linear-gradient(-45deg, transparent 75%, #c0c0c0 75%)`,
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
  backgroundColor: '#d8d8d8',
};

// ── 공통 Tailwind 클래스 상수 ──────────────────────────────────────
// IC: input/textarea 기본 스타일
// LC: 라벨 기본 스타일
export const IC = 'w-full p-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all';
export const LC = 'block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-wide';
