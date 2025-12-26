# Color Palette Generator - 구독 기반 서비스

AI 기반 인테리어 컬러 팔레트 생성기입니다. 로그인 및 구독이 필요한 서비스로 변경되었습니다.

## 🎯 주요 기능

- **계정 로그인 시스템**: NextAuth.js 기반 인증
  - 이메일/비밀번호 로그인
  - Google OAuth 로그인
- **구독 기반 서비스**: Stripe 결제 시스템
  - FREE, BASIC, PRO, ENTERPRISE 플랜
  - 라이센스 검증 시스템
- **AI 팔레트 생성**: Gemini AI 활용
- **유사 이미지 검색**: Pexels API 연동

## 🚀 설치 및 설정

### 1. 패키지 설치

```bash
npm install
```

### 2. 데이터베이스 설정

PostgreSQL 데이터베이스가 필요합니다.

#### 로컬 데이터베이스 설정

```bash
# Prisma를 사용하여 로컬 PostgreSQL 실행
npx prisma dev
```

또는 기존 PostgreSQL 사용:

```bash
# .env 파일 생성 및 DATABASE_URL 설정
cp .env.example .env
```

#### 데이터베이스 마이그레이션

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음 값들을 설정하세요:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/color_picker?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_here"  # openssl rand -base64 32로 생성

# Google OAuth (선택사항)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Gemini API
GEMINI_API_KEY="your_gemini_api_key"

# Pexels API
PEXELS_API_KEY="your_pexels_api_key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Price IDs
STRIPE_BASIC_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_ENTERPRISE_PRICE_ID="price_..."
```

### 4. Stripe 설정

1. [Stripe Dashboard](https://dashboard.stripe.com/)에 가입
2. API 키 생성 (개발 모드)
3. 제품 및 가격 생성:
   - BASIC 플랜 (월 ₩9,900)
   - PRO 플랜 (월 ₩29,900)
   - ENTERPRISE 플랜 (월 ₩99,900)
4. 각 가격의 Price ID를 `.env`에 추가
5. 웹훅 엔드포인트 설정:
   - URL: `https://yourdomain.com/api/webhook/stripe`
   - 이벤트: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`

### 5. Google OAuth 설정 (선택사항)

1. [Google Cloud Console](https://console.cloud.google.com/)
2. 새 프로젝트 생성
3. OAuth 2.0 클라이언트 ID 생성:
   - 승인된 리디렉션 URI: `http://localhost:3000/api/auth/callback/google`
4. Client ID와 Secret을 `.env`에 추가

### 6. API 키 발급

#### Gemini API
1. [Google AI Studio](https://makersuite.google.com/app/apikey)에서 API 키 발급

#### Pexels API
1. [Pexels API](https://www.pexels.com/api/)에서 무료 API 키 발급

## 🏃‍♂️ 실행

### 개발 모드

```bash
npm run dev
```

http://localhost:3000 에서 확인

### 프로덕션 빌드

```bash
npm run build
npm start
```

## 📝 사용 방법

### 1. 회원가입 및 로그인
- `/auth/signup` - 회원가입
- `/auth/signin` - 로그인

### 2. 구독하기
- `/pricing` - 요금제 선택 및 구독

### 3. 팔레트 생성
- 메인 페이지에서 인테리어 프롬프트 입력
- AI가 3가지 팔레트 추천
- 유사 이미지 검색 기능

## 🔐 보안 기능

- **인증 미들웨어**: 보호된 라우트에 자동 리디렉션
- **구독 검증**: API 호출 시 자동 라이센스 확인
- **비밀번호 암호화**: bcrypt 해싱
- **세션 관리**: JWT 기반 세션

## 🗂 프로젝트 구조

```
├── app/
│   ├── api/
│   │   ├── auth/              # 인증 관련 API
│   │   ├── generate-palette/  # 팔레트 생성 API
│   │   ├── search-similar/    # 이미지 검색 API
│   │   ├── subscribe/         # 구독 결제 API
│   │   ├── subscription/      # 구독 상태 조회 API
│   │   └── webhook/           # Stripe 웹훅
│   ├── auth/                  # 로그인/회원가입 페이지
│   ├── pricing/               # 요금제 페이지
│   └── page.tsx               # 메인 페이지
├── components/
│   └── Providers.tsx          # SessionProvider
├── lib/
│   ├── prisma.ts              # Prisma 클라이언트
│   ├── stripe.ts              # Stripe 클라이언트
│   └── subscription.ts        # 구독 검증 로직
├── prisma/
│   └── schema.prisma          # 데이터베이스 스키마
├── auth.ts                    # NextAuth 설정
└── middleware.ts              # 라우트 보호
```

## 🔄 데이터베이스 스키마

- **User**: 사용자 정보
- **Account**: OAuth 연동 정보
- **Session**: 세션 정보
- **Subscription**: 구독 정보
  - status: ACTIVE, INACTIVE, CANCELED, PAST_DUE
  - plan: FREE, BASIC, PRO, ENTERPRISE

## 🧪 테스트

### Stripe 테스트 카드

개발 모드에서 사용할 수 있는 테스트 카드:
- 카드 번호: `4242 4242 4242 4242`
- 만료일: 미래 날짜
- CVC: 아무 3자리 숫자

## 📚 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js v5 (beta)
- **Database**: PostgreSQL + Prisma ORM
- **Payment**: Stripe
- **AI**: Google Gemini AI
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## 🛠 트러블슈팅

### 데이터베이스 연결 오류
```bash
# Prisma Studio로 데이터베이스 확인
npx prisma studio
```

### 마이그레이션 리셋
```bash
npx prisma migrate reset
```

### Stripe 웹훅 테스트
```bash
# Stripe CLI 설치 후
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

## 📄 라이센스

MIT License

## 🤝 기여

이슈와 PR은 언제나 환영합니다!
