# Pantone 컬러 팔레트 추천 도구

AI 기술을 활용하여 인테리어 디자인 전문가를 위한 실시간 컬러 팔레트를 생성하는 업무 도구입니다.

## 주요 기능

- Google Gemini AI 기반 3개의 실시간 컬러 팔레트 동시 생성
- 산업 표준 Pantone 컬러 코드 제공
- 다양한 인테리어 스타일 및 공간에 맞춘 맞춤형 추천
- 각 컬러별 사용처 및 설명 포함
- 팔레트를 PNG 이미지로 다운로드 기능
- Pexels API 기반 유사 인테리어 이미지 자동 검색
- 원클릭 컬러 코드 복사로 작업 효율성 향상
- 밝은 모드와 어두운 모드 지원
- 전체 화면 로딩 오버레이로 명확한 작업 상태 표시

## 기술 스택

- **Frontend**: React, Next.js 14, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Backend**: Next.js API Routes

## 시작하기

### 1. 필요한 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하세요:

```bash
copy .env.example .env.local
```

`.env.local` 파일을 열고 API 키들을 입력하세요:

```
GEMINI_API_KEY=your_actual_gemini_api_key
PEXELS_API_KEY=your_pexels_api_key
```

**Gemini API 키 발급 방법:**
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 방문
2. Google 계정으로 로그인
3. "Create API Key" 클릭
4. 생성된 API 키 복사

**Pexels API 키 발급 방법 (선택사항):**
1. [Pexels API](https://www.pexels.com/api/) 방문
2. 무료 API 키 신청
3. 발급받은 API 키 복사 및 `.env.local`에 추가

### 3. 로컬 개발 서버 시작

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 4. 프로덕션 배포 준비

```bash
npm run build
npm start
```

## 사용 방법

1. 원하는 인테리어 스타일과 공간의 특성을 입력합니다.
2. "팔레트 생성" 버튼을 클릭하여 AI 분석을 시작합니다.
3. AI가 생성한 3가지 컬러 팔레트를 비교합니다.
4. 각 팔레트의 5개 컬러와 Pantone 코드를 확인합니다.
5. 선택한 컬러 코드를 클릭하여 즉시 복사합니다.
6. "다운로드" 버튼으로 팔레트를 PNG 이미지로 저장합니다.
7. "유사 이미지" 버튼으로 팔레트에 어울리는 인테리어 이미지를 검색합니다.
8. 클라이언트 프레젠테이션이나 디자인 작업에 활용합니다.

## 프로젝트 구조

```
Color-Picker/
├── app/
│   ├── api/
│   │   ├── generate-palette/
│   │   │   └── route.ts          # Gemini API로 3개 팔레트 생성
│   │   └── search-similar/
│   │       └── route.ts          # Pexels API로 유사 이미지 검색
│   ├── globals.css               # 전역 스타일
│   ├── layout.tsx                # 루트 레이아웃
│   └── page.tsx                  # 메인 페이지
├── components/
│   └── ColorPalette.tsx          # 컬러 팔레트 컴포넌트 (deprecated)
├── .env.example                  # 환경 변수 예시
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 특징

### 전문가급 AI 추천 엔진
Google Gemini AI가 인테리어 디자인의 전문 지식을 기반으로 공간의 특성과 스타일에 최적화된 컬러 조합을 한번에 3개 제시합니다. 사용자는 여러 옵션 중에서 최적의 팔레트를 선택할 수 있습니다.

### 산업 표준 Pantone 색상
Pantone 컬러 시스템을 활용하여 실제 클라이언트 작업과 시공에 바로 적용할 수 있는 정확한 색상 정보를 제공합니다.

### 이미지 기반 영감 제공
Pexels API를 통해 선택한 팔레트와 어울리는 실제 인테리어 이미지를 자동으로 검색하여 클라이언트에게 시각적인 참고 자료를 제공합니다.

### 생산성 향상
팔레트 다운로드, 컬러 코드 한 클릭 복사, 이미지 자동 검색 등의 기능으로 컬러 선정 시간을 단축하고 업무 효율을 극대화합니다.

## 라이선스

MIT License
